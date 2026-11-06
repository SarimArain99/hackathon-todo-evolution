#!/bin/bash
# deploy-minikube.sh - Automated deployment script for Phase IV: Local Kubernetes Deployment
# This script automates Minikube setup, Docker image building/loading, and Helm installation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHART_DIR="./helm/todo-app"
BACKEND_IMAGE="todo-backend:latest"
FRONTEND_IMAGE="todo-frontend:latest"
RELEASE_NAME="todo"
NAMESPACE="todo-app"
INGRESS_HOST="todo.local"

# Print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check required commands
check_commands() {
    print_info "Checking required commands..."
    local required_commands=("minikube" "kubectl" "helm" "docker")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            print_error "$cmd is not installed. Please install it first."
            exit 1
        fi
    done
    print_success "All required commands are available."
}

# Check Minikube status
check_minikube() {
    print_info "Checking Minikube status..."
    if minikube status &> /dev/null; then
        print_success "Minikube is running."
    else
        print_warning "Minikube is not running. Starting Minikube..."
        minikube start --cpus=2 --memory=4096 --driver=docker
        print_success "Minikube started."
    fi
}

# Enable nginx ingress addon
enable_ingress() {
    print_info "Ensuring nginx ingress addon is enabled..."
    if kubectl get svc -n ingress-nginx &> /dev/null; then
        print_success "nginx ingress addon already enabled."
    else
        minikube addons enable ingress
        print_info "Waiting for ingress controller to be ready..."
        kubectl wait --namespace ingress-nginx \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/component=controller \
            --timeout=300s
        print_success "nginx ingress addon enabled and ready."
    fi
}

# Build Docker images
build_images() {
    print_info "Building Docker images..."

    # Build backend image
    print_info "Building backend image: $BACKEND_IMAGE"
    docker build -t "$BACKEND_IMAGE" ./backend/

    # Build frontend image
    print_info "Building frontend image: $FRONTEND_IMAGE"
    docker build -t "$FRONTEND_IMAGE" ./frontend/

    print_success "Docker images built successfully."
}

# Load images into Minikube
load_images() {
    print_info "Loading images into Minikube..."
    minikube image load "$BACKEND_IMAGE"
    minikube image load "$FRONTEND_IMAGE"
    print_success "Images loaded into Minikube."
}

# Check required environment variables
check_env_vars() {
    print_info "Checking environment variables..."

    # Check if required env vars are set or provided
    if [[ -z "$DATABASE_URL" ]]; then
        print_warning "DATABASE_URL not set. Using default: sqlite:////app/data/todo.db"
        DATABASE_URL="sqlite:////app/data/todo.db"
    fi

    if [[ -z "$BETTER_AUTH_SECRET" ]]; then
        print_error "BETTER_AUTH_SECRET is required!"
        print_info "Usage: $0 --set DATABASE_URL=... --set BETTER_AUTH_SECRET=... --set OPENAI_API_KEY=..."
        exit 1
    fi

    if [[ -z "$OPENAI_API_KEY" ]]; then
        print_error "OPENAI_API_KEY is required!"
        print_info "Usage: $0 --set DATABASE_URL=... --set BETTER_AUTH_SECRET=... --set OPENAI_API_KEY=..."
        exit 1
    fi

    print_success "Environment variables validated."
}

# Create namespace if needed
create_namespace() {
    print_info "Ensuring namespace exists: $NAMESPACE"
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
}

# Install or upgrade Helm chart
install_helm_chart() {
    print_info "Deploying application via Helm..."

    # Check if release exists
    if helm list -n "$NAMESPACE" | grep -q "^$RELEASE_NAME"; then
        print_info "Upgrading existing Helm release: $RELEASE_NAME"
        helm upgrade "$RELEASE_NAME" "$CHART_DIR" \
            --namespace "$NAMESPACE" \
            --set backend.env.DATABASE_URL="$DATABASE_URL" \
            --set backend.env.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
            --set backend.env.OPENAI_API_KEY="$OPENAI_API_KEY"
    else
        print_info "Installing new Helm release: $RELEASE_NAME"
        helm install "$RELEASE_NAME" "$CHART_DIR" \
            --namespace "$NAMESPACE" \
            --create-namespace \
            --set backend.env.DATABASE_URL="$DATABASE_URL" \
            --set backend.env.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
            --set backend.env.OPENAI_API_KEY="$OPENAI_API_KEY"
    fi

    print_success "Helm chart deployed successfully."
}

# Wait for pods to be ready
wait_for_pods() {
    print_info "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod --namespace "$NAMESPACE" --timeout=300s -l app.kubernetes.io/part-of=todo-app
    print_success "All pods are ready."
}

# Display access information
show_access_info() {
    local minikube_ip
    minikube_ip=$(minikube ip)

    echo ""
    echo "=============================================="
    print_success "Deployment Complete!"
    echo "=============================================="
    echo ""
    echo "Access the application at:"
    echo "  URL: http://$INGRESS_HOST"
    echo ""
    echo "To access the application, add the following entry to /etc/hosts:"
    echo "  ${YELLOW}echo \"$minikube_ip $INGRESS_HOST\" | sudo tee -a /etc/hosts${NC}"
    echo ""
    echo "Or use port-forwarding:"
    echo "  ${YELLOW}kubectl port-forward -n $NAMESPACE svc/frontend 3000:3000${NC}"
    echo ""
    echo "Check pod status:"
    echo "  ${YELLOW}kubectl get pods -n $NAMESPACE${NC}"
    echo ""
    echo "Check logs:"
    echo "  Backend: ${YELLOW}kubectl logs -n $NAMESPACE -l app=backend${NC}"
    echo "  Frontend: ${YELLOW}kubectl logs -n $NAMESPACE -l app=frontend${NC}"
    echo ""
}

# Main execution
main() {
    echo "=============================================="
    echo "  Todo Evolution - Minikube Deployment"
    echo "  Phase IV: Local Kubernetes Deployment"
    echo "=============================================="
    echo ""

    # Parse arguments for environment variables
    while [[ $# -gt 0 ]]; do
        case $1 in
            --set)
                shift
                KEY="${1%%=*}"
                VALUE="${1#*=}"
                export "$KEY=$VALUE"
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Usage: $0 [--set KEY=VALUE]..."
                exit 1
                ;;
        esac
        shift
    done

    # Execute deployment steps
    check_commands
    check_minikube
    enable_ingress
    build_images
    load_images
    check_env_vars
    create_namespace
    install_helm_chart
    wait_for_pods
    show_access_info
}

# Run main
main "$@"
