import Cors from "cors";

const corsMiddleware = Cors({
  origin: "*", 
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
