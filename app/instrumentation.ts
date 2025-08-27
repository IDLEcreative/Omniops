export async function register() {
  // Handle unhandled promise rejections
  if (process.env.NODE_ENV === 'development') {
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Log the stack trace
      if (reason instanceof Error) {
        console.error(reason.stack);
      }
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      console.error(error.stack);
      // In production, you might want to gracefully shut down
      // process.exit(1);
    });
  }
  
  // Import env check to validate on startup
  if (typeof window === 'undefined') {
    await import('@/lib/env-check');
  }
}