// Vercel function: bot Telegram báo bất thường (pg_cron gọi mỗi 5 phút)
export { handleAlertRequest as default } from '../server/alerts.js'
