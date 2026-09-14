# Self-Healing Linux Server

A self-hosted Linux platform designed to automatically detect failures, recover services, and perform safe deployments with minimal manual intervention.

This project was developed as my **degree project (examensarbete)** during my **DevOps Engineer Higher Vocational Education (YH) program at Nackademin in Stockholm, Sweden**.

The project demonstrates DevOps and Site Reliability Engineering concepts by combining **Blue/Green deployments, automated health checks, rollback mechanisms, event-driven self-healing, monitoring, logging, and alerting** into a fully self-hosted environment.

The platform runs containerized applications using Docker and uses Nginx to route traffic between Blue and Green environments. Before a new version receives production traffic, automated health checks verify that the deployment is working correctly. If a deployment fails, the system can automatically roll back to the previous healthy version.

A self-healing system also monitors Docker events and service health. When failures are detected, recovery scripts attempt to restore the affected services automatically and record the incident.

## Key Features

* Blue/Green deployments with near-zero downtime
* Automated deployment health checks
* Automatic rollback when deployments fail
* Event-driven self-healing
* Docker container monitoring
* Automated incident logging
* Discord notifications and alerts
* Infrastructure and application monitoring
* Centralized log collection
* Service availability monitoring

## Technology Stack

**Infrastructure**

* Ubuntu Server
* Docker
* Docker Compose
* Nginx

**Application**

* Next.js

**Observability**

* Prometheus
* Grafana
* Loki
* Promtail
* cAdvisor
* Node Exporter
* Blackbox Exporter
* Alertmanager

**Automation**

* Bash
* Python
* Docker Events
* Health Check Scripts
* Discord Webhooks

## Architecture

The application runs in two separate environments:

`Blue → Port 3001`
`Green → Port 3002`

Nginx acts as the entry point and routes production traffic to the currently active environment.

During deployment, the inactive environment is updated first. Health checks verify the new version before traffic is switched. If the new deployment is unhealthy, the platform keeps or restores the previous healthy environment.

The self-healing layer continuously reacts to container failures and health events, allowing services to recover automatically without requiring immediate manual intervention.

## Purpose

This project was built to explore how modern DevOps practices can improve the reliability of self-hosted Linux infrastructure.

The goal is to create a platform that can:

**Deploy → Monitor → Detect → Recover → Alert → Record**

with as little manual intervention as possible.
