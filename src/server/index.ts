import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '3210', 10);

const { app } = createApp();

app.listen(PORT, () => {
  console.log(`🦞 Travel Claw Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
