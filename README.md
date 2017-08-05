# Popeye 

Popeye is a boilerplate code to kickstart your node applications. 


It supports clustered apps, json webtoken based authentication and acl based 
user access management. 


## Installation

To start, simply clone this project, cd to the project directory and do `run npm install`.
 
## Configuration

We are using dotenv for maintaining environment variables based configuration. Sample configs
 are stored in `.env.sample` file. DO NOT use this file on a production server.
  
Instead, copy the `.env.sample` file to `.env` and update `bin/www.js` to use .env file instead and make sure to not commit `.env` file.

## Running

By default, the app runs on port `3000`, you can specify a different port using environment variable `PORT`

To start, run the command 

`npm start`
 
 Additionally, you can also provide environment variable `PORT=5000` or your choice of port
 to start the app on that port.
 
 