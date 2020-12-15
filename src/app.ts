/**
 * ** NOTE ** add .env on gitignore
 */
// load .env file immediately
require("dotenv").config({ path: `${__dirname}/../.env` })

import express, { Response, Request, Application,  NextFunction} from "express"
import mongoose from "mongoose"
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import yaml from 'yamljs'

// routers
import indexRouter from './routers/index'

const fingerprint = require('express-fingerprint')

class Main {
  private app: Application
  private port: string | number | any
  private io: any
  private dbUrlString: string | any

  constructor() {
    this.app = express()
    this.port = process.env.PORT
    this.dbUrlString = `mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}`
    this.appConfig()
  }

  public listen() {
    this.app.listen(this.port, (): void => {
      console.log(`*** Server is listening on port ${this.port}`)
    })
  }

  private connectToDatabase() {
    mongoose.set("useUnifiedTopology", true)
    mongoose.set("useFindAndModify", false)
    mongoose.set("useCreateIndex", true)
    mongoose.set("useNewUrlParser", true)
    mongoose.connect(this.dbUrlString)
      .then((): void => {
        console.log(
          `*** Server is connected to database. Connection String: ${this.dbUrlString}`
        )
      })
      .catch((error: string): void => {
        console.log(
          `*** Server connection to the database failed. Connection String: ${this.dbUrlString}. Error: ${error}`
        )
      })
  }

  private loadSwaggerUi() {
    const swaggerDocument = yaml.load('./docs/openapi.yaml')
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(
      swaggerDocument,
      {explorer: true},
    ))
  }

  private loadRouters() {
    this.app.use('', indexRouter)
  }

  private appConfig() {
    this.app.use(morgan("dev"))
    // restrict headers contents and methods
    // allowed all for development
    this.app.use((request: Request, response: Response, next: NextFunction) => {
      response.header("Access-Control-Allow-Origin", "*")
      response.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Authorization, Content-Type, Accept"
      )
      response.setHeader("Access-Control-Allow-Credentials", "true")
      if (request.method === "OPTIONS") {
        response.header(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, PATCH, DELETE"
        )
        return response.sendStatus(200)
      }
      next()
    })

    this.app.use(express.urlencoded({ extended: false }))
    this.app.use(fingerprint({
      parameters: [
        fingerprint.useragent,
        fingerprint.acceptHeaders,
        fingerprint.geoip
      ]
    }))

    this.connectToDatabase()
    this.loadSwaggerUi()
    this.loadRouters()
  }
}

const main = new Main()
main.listen()
