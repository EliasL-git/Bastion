# Bastion DNS

Lightweight DNS sinkhole dashboard with real-time query logging, block/allow lists, and upstream forwarding.

## Install (Global)

```bash
npm install -g bastion-dns
```

## Quick Start

```bash
# One-time setup
bastion-dns setup

# Start the service
bastion-dns start

# Open the dashboard
open http://localhost:4455
```

Default login: `admin` / `admin`

## Commands

| Command | Description |
|---|---|
| `bastion-dns setup` | First-time setup — creates `.env`, generates Prisma client, pushes DB schema, seeds admin account |
| `bastion-dns start` | Start production services (Next.js on `:4455` + DNS proxy on `:53`) |
| `bastion-dns stop` | Stop all Bastion services |
| `bastion-dns status` | Show running services and their PIDs |
| `bastion-dns dev` | Start in development mode with hot reload |

## DNS Setup

Point your router or device DNS to the machine running Bastion on **port 53**. Blocked domains redirect to the block page, allowed queries forward to your upstream DNS.
