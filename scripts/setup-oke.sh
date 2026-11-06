#!/bin/bash
# Oracle Kubernetes Engine (OKE) Cluster Setup Script
# T148: Creates and configures an OKE cluster for Todo application deployment
#
# Prerequisites:
# - Oracle Cloud Infrastructure (OCI) CLI installed and configured
# - OCI API key with appropriate permissions
# - kubectl installed locally
#
# Usage: ./scripts/setup-oke.sh [--compartment-id OCID] [--cluster-name NAME]

set -e  # Exit on error
set -u  # Exit on undefined variable

#=============================================================================
# Configuration
#=============================================================================
CLUSTER_NAME="${CLUSTER_NAME:-todo-app-cluster}"
NODE_POOL_NAME="${NODE_POOL_NAME:-todo-app-node-pool}"
COMPARTMENT_ID="${COMPARTMENT_ID:-}"  # Required: Pass via env or argument
REGION="${REGION:-us-ashburn}"  # Ashburn region (change as needed)

# Node pool configuration
NODE_SHAPE="${NODE_SHAPE:-VM.Standard.E4.Flex}"  # Flexible shape
OCPUS="${OCPUS:-2}"  # OCPU count per node
MEMORY="${MEMORY:-8}"  # GB memory per node
NODE_COUNT="${NODE_COUNT:-2}"

# Kubernetes version
KUBERNETES_VERSION="${KUBERNETES_VERSION:-v1.28.2}"

# VCN configuration
VCN_NAME="${VCN_NAME:-todo-app-vcn}"
SUBNET_NAME="${SUBNET_NAME:-todo-app-subnet}"

#=============================================================================
# Functions
#=============================================================================

log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
    exit 1
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check OCI CLI
    if ! command -v oci &> /dev/null; then
        log_error "OCI CLI not found. Install from: https://docs.oracle.com/en-us/iaas/Content/API/Concepts/cliconcepts.htm"
    fi

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Install from: https://kubernetes.io/docs/tasks/tools/"
    fi

    # Check OCI CLI is configured
    if ! oci setup validate &> /dev/null; then
        log_error "OCI CLI not configured. Run 'oci setup config' first."
    fi

    # Check compartment ID
    if [[ -z "${COMPARTMENT_ID}" ]]; then
        log_error "COMPARTMENT_ID environment variable must be set. Export it or pass via --compartment-id"
    fi

    log_success "Prerequisites check passed"
}

create_vcn() {
    log_info "Creating VCN: ${VCN_NAME}"

    # Check if VCN already exists
    VCN_ID=$(oci network vcn list \
        --compartment-id "${COMPARTMENT_ID}" \
        --query "data[?\"display-name\"=='${VCN_NAME}'].id | [0]" \
        --raw-output 2>/dev/null || echo "")

    if [[ -n "${VCN_ID}" ]]; then
        log_info "VCN already exists: ${VCN_ID}"
        echo "${VCN_ID}"
        return 0
    fi

    # Create VCN
    VCN_ID=$(oci network vcn create \
        --compartment-id "${COMPARTMENT_ID}" \
        --display-name "${VCN_NAME}" \
        --cidr-block "10.0.0.0/16" \
        --query "data.id" \
        --raw-output)

    log_success "VCN created: ${VCN_ID}"

    # Create internet gateway
    log_info "Creating Internet Gateway..."
    IG_ID=$(oci network internet-gateway create \
        --compartment-id "${COMPARTMENT_ID}" \
        --vcn-id "${VCN_ID}" \
        --is-enabled true \
        --display-name "${VCN_NAME}-ig" \
        --query "data.id" \
        --raw-output)

    # Create route table
    log_info "Creating Route Table..."
    RT_ID=$(oci network route-table create \
        --compartment-id "${COMPARTMENT_ID}" \
        --vcn-id "${VCN_ID}" \
        --display-name "${VCN_NAME}-rt" \
        --route-rules "[{\"cidrBlock\":\"0.0.0.0/0\",\"networkEntityId\":\"${IG_ID}\"}]" \
        --query "data.id" \
        --raw-output)

    # Create subnet
    log_info "Creating Subnet: ${SUBNET_NAME}"
    SUBNET_ID=$(oci network subnet create \
        --compartment-id "${COMPARTMENT_ID}" \
        --vcn-id "${VCN_ID}" \
        --display-name "${SUBNET_NAME}" \
        --cidr-block "10.0.1.0/24" \
        --route-table-id "${RT_ID}" \
        --prohibit-public-ip-on-vnic false \
        --query "data.id" \
        --raw-output)

    # Create security list for Kubernetes API
    log_info "Creating Security List for Kubernetes..."
    oci network security-list create \
        --compartment-id "${COMPARTMENT_ID}" \
        --vcn-id "${VCN_ID}" \
        --display-name "${VCN_NAME}-k8s-sl" \
        --egress-security-rules "[{\"destination\":\"0.0.0.0/0\",\"isStateless\":false,\"protocol\":\"6\",\"tcpOptions\":{\"destinationPortRange\":{\"max\":65535,\"min\":1}}}]" \
        --ingress-security-rules "[{\"isStateless\":false,\"protocol\":\"6\",\"source\":\"0.0.0.0/0\",\"tcpOptions\":{\"destinationPortRange\":{\"max\":6443,\"min\":6443},\"sourcePortRange\":{\"max\":65535,\"min\":1}}},{\"isStateless\":false,\"protocol\":\"6\",\"source\":\"0.0.0.0/0\",\"tcpOptions\":{\"destinationPortRange\":{\"max\":443,\"min\":443},\"sourcePortRange\":{\"max\":65535,\"min\":1}}},{\"isStateless\":false,\"protocol\":\"6\",\"source\":\"0.0.0.0/0\",\"tcpOptions\":{\"destinationPortRange\":{\"max\":10250,\"min\":10250},\"sourcePortRange\":{\"max\":65535,\"min\":1}}}]" \
        > /dev/null

    log_success "Network setup complete"
    echo "${SUBNET_ID}"
}

create_cluster() {
    log_info "Creating OKE Cluster: ${CLUSTER_NAME}"

    # Get subnet ID
    SUBNET_ID=$(create_vcn)

    # Create cluster
    CLUSTER_ID=$(oci ce cluster create \
        --compartment-id "${COMPARTMENT_ID}" \
        --name "${CLUSTER_NAME}" \
        --kubernetes-version "${KUBERNETES_VERSION}" \
        --type "ENHANCED_CLUSTER"  # Enhanced cluster with managed control plane \
        --endpoint-subnet-id "${SUBNET_ID}" \
        --vcn-id "${VCN_ID}" \
        --pods-cidr "10.244.0.0/16" \
        --services-cidr "10.96.0.0/16" \
        --is-kubernetes-dashboard-enabled false \
        --is-dei-usage-enabled false \
        --query "data.id" \
        --raw-output)

    log_success "Cluster created: ${CLUSTER_ID}"

    # Wait for cluster to become active
    log_info "Waiting for cluster to become active (this may take several minutes)..."
    oci ce cluster wait \
        --cluster-id "${CLUSTER_ID}" \
        --wait-for-state "ACTIVE" \
        --wait-interval-seconds 30 \
        --max-wait-seconds 1800

    log_success "Cluster is active"

    echo "${CLUSTER_ID}"
}

create_node_pool() {
    local CLUSTER_ID="$1"

    log_info "Creating Node Pool: ${NODE_POOL_NAME}"

    # Get subnet ID
    SUBNET_ID=$(oci network subnet list \
        --compartment-id "${COMPARTMENT_ID}" \
        --vcn-id "${VCN_ID}" \
        --query "data[?\"display-name\"=='${SUBNET_NAME}'].id | [0]" \
        --raw-output)

    # Create node pool
    NODE_POOL_ID=$(oci ce node-pool create \
        --cluster-id "${CLUSTER_ID}" \
        --compartment-id "${COMPARTMENT_ID}" \
        --name "${NODE_POOL_NAME}" \
        --kubernetes-version "${KUBERNETES_VERSION}" \
        --node-shape "${NODE_SHAPE}" \
        --node-shape-config "{\"ocpus\": ${OCPUS}, \"memoryInGBs\": ${MEMORY}}" \
        --initial-node-labels "{\"key\":\"name\",\"value\":\"todo-app\"}" \
        --quantity "${NODE_COUNT}" \
        --subnet-id "${SUBNET_ID}" \
        --query "data.id" \
        --raw-output)

    log_success "Node Pool created: ${NODE_POOL_ID}"

    # Wait for nodes to become ready
    log_info "Waiting for nodes to become ready (this may take several minutes)..."
    oci ce node-pool wait \
        --node-pool-id "${NODE_POOL_ID}" \
        --wait-for-state "ACTIVE" \
        --wait-interval-seconds 30 \
        --max-wait-seconds 1800

    log_success "Node pool is active"
}

configure_kubectl() {
    local CLUSTER_ID="$1"

    log_info "Configuring kubectl..."

    # Get cluster endpoint
    CLUSTER_ENDPOINT=$(oci ce cluster get \
        --cluster-id "${CLUSTER_ID}" \
        --query "data.endpoints.public" \
        --raw-output)

    # Create kubeconfig
    mkdir -p ~/.kube
    oci ce cluster create-kubeconfig \
        --cluster-id "${CLUSTER_ID}" \
        --file ~/.kube/config \
        --token-version 2.0

    export KUBECONFIG=~/.kube/config

    # Wait for API server to be ready
    log_info "Waiting for Kubernetes API server..."
    local max_attempts=60
    local attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        if kubectl get nodes &> /dev/null; then
            log_success "kubectl configured successfully"
            kubectl get nodes
            return 0
        fi
        ((attempt++))
        sleep 5
    done

    log_error "Timed out waiting for Kubernetes API server"
}

install_dapr() {
    log_info "Installing Dapr to cluster..."

    # Initialize Dapr
    dapr init -k \
        --runtime-version 1.13.0 \
        --log-as-json

    log_success "Dapr installed"
}

#=============================================================================
# Main
#=============================================================================

main() {
    log_info "Starting Oracle OKE Cluster Setup..."
    log_info "Cluster: ${CLUSTER_NAME}"
    log_info "Compartment: ${COMPARTMENT_ID}"
    log_info "Region: ${REGION}"

    check_prerequisites

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --compartment-id)
                COMPARTMENT_ID="$2"
                shift 2
                ;;
            --cluster-name)
                CLUSTER_NAME="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                ;;
        esac
    done

    # Create cluster
    CLUSTER_ID=$(create_cluster)

    # Create node pool
    create_node_pool "${CLUSTER_ID}"

    # Configure kubectl
    configure_kubectl "${CLUSTER_ID}"

    # Install Dapr
    if command -v dapr &> /dev/null; then
        install_dapr
    else
        log_info "Dapr CLI not found. Install from: https://docs.dapr.io/getting-started/install-dapr-cli/"
        log_info "Then run: dapr init -k"
    fi

    log_success "========================================"
    log_success "OKE Cluster Setup Complete!"
    log_success "========================================"
    log_success "Cluster Name: ${CLUSTER_NAME}"
    log_success "Cluster ID: ${CLUSTER_ID}"
    log_success "Region: ${REGION}"
    log_success ""
    log_success "Next Steps:"
    log_success "1. Deploy application with: helm install todo-app ./helm/todo-app -f helm/todo-app/values-cloud.yaml"
    log_success "2. Install Redpanda: ./scripts/install-redpanda.sh"
    log_success "3. Apply Dapr components: kubectl apply -f dapr-components/ -n todo-app"
    log_success ""
}

# Run main
main "$@"
