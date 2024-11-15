import express from 'express'
import dotenv from 'dotenv'
import DBconnection from './config/DBconnection.js'
import routes from "./routes/routes.js"

dotenv.config()
DBconnection()

const port = process.env.PORT || 7200
const app = express()

// Middleware to parse JSON
app.use(express.json());

app.use("/api/v1", routes)

app.get("/test", (req, res) => {
    res.send("Welcom to empty url")
})

app.listen(port, ()=>{
    console.log(`Server Running on port ${port}`)
})