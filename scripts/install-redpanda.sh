#!/bin/bash
# Redpanda Installation Script for Kubernetes
# T149: Installs Redpanda (Kafka-compatible) message broker on OKE
#
# Prerequisites:
# - kubectl configured to point to target cluster
# - Helm 3.x installed
#
# Usage: ./scripts/install-redpanda.sh [--namespace NAMESPACE] [--release RELEASE]

set -e  # Exit on error
set -u  # Exit on undefined variable

#=============================================================================
# Configuration
#=============================================================================
NAMESPACE="${NAMESPACE:-todo-app}"
RELEASE_NAME="${RELEASE_NAME:-redpanda}"
REPO="${REPO:-https://charts.redpanda.com}"
CHART="${CHART:-redpanda}"
CHART_VERSION="${CHART_VERSION:-v25.0.4}"

# Redpanda configuration
REPLICAS="${REPLICAS:-1}"  # Single node for development
CPU_REQUEST="${CPU_REQUEST:-100m}"
MEMORY_REQUEST="${MEMORY_REQUEST:-256Mi}"
STORAGE="${STORAGE:-1Gi}"

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

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Install from: https://kubernetes.io/docs/tasks/tools/"
    fi

    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "Helm not found. Install from: https://helm.sh/docs/intro/install/"
    fi

    # Check cluster connectivity
    if ! kubectl get nodes &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Check kubeconfig."
    fi

    log_success "Prerequisites check passed"
}

add_redpanda_helm_repo() {
    log_info "Adding Redpanda Helm repository..."

    # Check if repo already exists
    if helm repo list | grep -q "^${REPO}"; then
        log_info "Redpanda repo already exists. Updating..."
        helm repo update "${REPO_NAME:-redpanda}"
    else
        helm repo add redpanda "${REPO}"
        helm repo update
    fi

    log_success "Redpanda Helm repository added"
}

create_namespace() {
    log_info "Creating namespace: ${NAMESPACE}..."

    if kubectl get namespace "${NAMESPACE}" &> /dev/null; then
        log_info "Namespace already exists"
    else
        kubectl create namespace "${NAMESPACE}"
        log_success "Namespace created"
    fi
}

install_redpanda() {
    log_info "Installing Redpanda..."

    # Create values file for installation
    cat < /tmp/redpanda-values.yaml
# Redpanda values for Todo App deployment
# Minimal configuration for development/testing

# Number of brokers
replicas: ${REPLICAS}

# Resource allocation
resources:
  requests:
    cpu: ${CPU_REQUEST}
    memory: ${MEMORY_REQUEST}
  limits:
    cpu: 500m
    memory: 512Mi

# Storage configuration
storage:
  persistentVolume:
    enabled: true
    size: ${STORAGE}
    storageClass: oci-bv  # Oracle Cloud Block Storage

# Listener configuration
external:
  enabled: true
  type: LoadBalancer

listeners:
  - name: external
    port: 9092
    tls: false  # Disable TLS for development

# Admin API
admin:
  enabled: true
  port: 9644

# Developer mode (disable tuning for development)
tieredStorage: {}
developerMode: true

# Disable unnecessary features for dev
console:
  enabled: false

# Monitoring (optional - enable for production)
metrics:
  enabled: false
EOF

    # Install Redpanda
    helm upgrade --install "${RELEASE_NAME}" redpanda/"${CHART}" \
        --version "${CHART_VERSION}" \
        --namespace "${NAMESPACE}" \
        --values /tmp/redpanda-values.yaml \
        --wait \
        --timeout 5m

    log_success "Redpanda installed"

    # Cleanup
    rm -f /tmp/redpanda-values.yaml
}

verify_installation() {
    log_info "Verifying Redpanda installation..."

    # Wait for pods to be ready
    kubectl wait \
        --for=condition=ready pod \
        -l app.kubernetes.io/instance="${RELEASE_NAME}" \
        --namespace "${NAMESPACE}" \
        --timeout=5m

    log_success "Redpanda pods are ready"

    # Show pod status
    echo ""
    log_info "Pod Status:"
    kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/instance="${RELEASE_NAME}"

    # Get service endpoint
    ENDPOINT=$(kubectl get svc "${RELEASE_NAME}" \
        -n "${NAMESPACE}" \
        -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

    if [[ "${ENDPOINT}" == "pending" ]]; then
        log_info "LoadBalancer endpoint is being provisioned..."
    else
        log_success "Redpanda endpoint: ${ENDPOINT}:9092"
    fi
}

create_kafka_topic() {
    local topic="$1"
    local partitions="${2:-1}"
    local replication_factor="${3:-1}"

    log_info "Creating Kafka topic: ${topic}"

    # Get the Redpanda pod name
    POD=$(kubectl get pods -n "${NAMESPACE}" \
        -l app.kubernetes.io/instance="${RELEASE_NAME}" \
        -o jsonpath='{.items[0].metadata.name}')

    # Create topic using rpk (Redpanda CLI)
    kubectl exec -n "${NAMESPACE}" "${POD}" -- \
        rpk topic create "${topic}" \
        --partitions "${partitions}" \
        --replicas "${replication_factor}" \
        --if-not-exists \
        > /dev/null 2>&1 || log_info "Topic may already exist"

    log_success "Topic ${topic} ready"
}

setup_topics() {
    log_info "Setting up Kafka topics..."

    # Wait a bit for Redpanda to be fully ready
    sleep 10

    # Create topics for the Todo App
    create_kafka_topic "task-events" 3 1
    create_kafka_topic "reminders" 1 1
    create_kafka_topic "notifications" 1 1

    log_success "Kafka topics configured"
}

print_connection_info() {
    echo ""
    log_success "========================================"
    log_success "Redpanda Installation Complete!"
    log_success "========================================"
    echo ""
    log_info "Internal Kafka Endpoint (for cluster):"
    echo "  ${RELEASE_NAME}.${NAMESPACE}.svc.cluster.local:9092"
    echo ""
    log_info "External Endpoint:"
    kubectl get svc "${RELEASE_NAME}" -n "${NAMESPACE}"
    echo ""
    log_info "Topics Created:"
    echo "  - task-events (3 partitions)"
    echo "  - reminders (1 partition)"
    echo "  - notifications (1 partition)"
    echo ""
    log_info "To connect from outside the cluster:"
    echo "  kubectl port-forward -n ${NAMESPACE} svc/${RELEASE_NAME} 9092:9092"
    echo ""
    log_info "To manage topics:"
    echo "  kubectl exec -n ${NAMESPACE} \${POD} -- rpk topic list"
    echo ""
}

#=============================================================================
# Main
#=============================================================================

main() {
    log_info "Starting Redpanda Installation..."
    log_info "Namespace: ${NAMESPACE}"
    log_info "Release: ${RELEASE_NAME}"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --release)
                RELEASE_NAME="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                ;;
        esac
    done

    check_prerequisites
    add_redpanda_helm_repo
    create_namespace
    install_redpanda
    verify_installation
    setup_topics
    print_connection_info
}

# Run main
main "$@"
