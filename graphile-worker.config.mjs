import "dotenv/config"; // This loads variables from your .env file

export default {
  // Uses your Next.js environment variable automatically
  connectionString: process.env.DATABASE_URL, 
  
  // Points to your tasks folder
  taskDirectory: `${process.cwd()}/tasks`, 
  
  // Optional: Max number of jobs to run at the exact same time
  concurrentJobs: 5, 
};
