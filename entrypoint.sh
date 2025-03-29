#!/bin/bash

# Create a directory to store environment variables for client-side
mkdir -p /app/public

# Generate runtime environment config
echo "Generating runtime environment configuration..."

# Start creating the env-config.js with an object
echo "window.__ENV = {" > /app/public/env-config.js

# Process all environment variables that start with NEXT_PUBLIC_
for var in $(env | grep '^NEXT_PUBLIC_' | cut -d= -f1); do
  # Get the value of the variable
  value=$(printenv $var)
  # Escape any double quotes in the value
  escaped_value=$(echo $value | sed 's/"/\\"/g')
  # Add to the env-config.js file
  echo "  \"$var\": \"$escaped_value\"," >> /app/public/env-config.js
done

# Handle BASE_URL separately if it exists
if [ ! -z "$BASE_URL" ]; then
  echo "  \"BASE_URL\": \"$BASE_URL\"," >> /app/public/env-config.js

  # Also perform the URL replacement in the built files
  echo "Replacing URLs in built files with BASE_URL=$BASE_URL"
  find /app/.next -type f -exec sed -i "s|http://localhost:9500|$BASE_URL|g" {} +
fi

# Close the object
echo "}" >> /app/public/env-config.js

echo "Runtime environment configuration generated at /app/public/env-config.js"

# Make the file accessible
chmod 644 /app/public/env-config.js

echo "Starting Next.js application..."
# Execute the command passed to the entrypoint
exec "$@"
