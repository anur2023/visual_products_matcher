#!/bin/bash

# Start backend
cd /app/backend && python main.py &

# Start nginx
nginx -g "daemon off;"