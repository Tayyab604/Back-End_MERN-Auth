import mongoose from "mongoose";

const DBconnection = async () =>{
    try {
        const connect = await mongoose.connect(process.env.MONGO_URL)
        console.log('DB connection successfull :)' )
    } catch (error) {
        console.error("DB connection failed :(")
    }
}

export default DBconnection