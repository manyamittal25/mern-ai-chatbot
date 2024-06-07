import { GoogleGenerativeAI } from "@google/generative-ai";
import User from '../models/User.js';

const genAI = new GoogleGenerativeAI("AIzaSyCZHbUXAFPJxHzD5McDVKLZzX0gZQoXkGo");

export const generateChatCompletion = async (req, res, next) => {
    try {
        const { message } = req.body;

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Find the user by ID from the JWT data
        const user = await User.findById(res.locals.jwtData.id);
        if (!user) {
            return res.status(401).json({ message: "User not registered OR Token malfunctioned" });
        }

        // Grab chats of user
        const chats = user.chats.map(({ role, content }) => ({
            role,
            content,
        }));

        // Add the new user message to the chats
        chats.push({ content: message, role: 'user' });
        user.chats.push({ content: message, role: 'user' });
        
        // Generate content based on the prompt
        const result = await model.generateContent(message);

        // Extract the text response from the result
        const response = await result.response;
        const text = response.text();
        
        // Add the AI response to the user's chat history
        user.chats.push({ content: text, role: 'assistance' });
        await user.save();

        // Send the text response back to the client
        return res.status(200).json({ chats: user.chats });
    } catch (error) {
        // Handle errors
        console.error("Error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const sendChatsToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //user token check
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    return res.status(200).json({ message: "OK", chats: user.chats });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //user token check
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    //@ts-ignore
    user.chats = [];
    await user.save();
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ message: "ERROR", cause: error.message });
  }
};
