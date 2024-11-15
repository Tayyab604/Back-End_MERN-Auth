import express from 'express'
import { forgotPassword, passwordChange, resendVerificationEmail, signin, signup, verifyEmail } from '../controllers/controller.js';

const routes = express.Router();

routes.post("/signup", signup);
routes.post("/signin", signin);

routes.get("/verify-email/:token", verifyEmail)
routes.post("/resend-verify-email", resendVerificationEmail)
routes.post("/forgot-password", forgotPassword)
routes.post("/forgot-pass/:token", passwordChange);


export default routes;