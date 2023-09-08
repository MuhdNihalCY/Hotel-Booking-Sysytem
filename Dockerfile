# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install app dependencies inside the container
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Set the environment variable for the port (optional)
ENV PORT=3300

# Expose the port the app will run on
EXPOSE 3300

# Define the command to run the app
CMD [ "npm", "start" ]
