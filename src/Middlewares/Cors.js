import Cors from "cors";

const corsMiddleware = Cors({
  origin: "*", // Change this to your frontend URL for security
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

export default function runCors(req, res) {
  return new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => 
      result instanceof Error ? reject(result) : resolve(result)
    );
  });
}
