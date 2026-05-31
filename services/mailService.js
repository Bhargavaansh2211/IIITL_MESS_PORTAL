function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getMailConfig() {
    const host = process.env.MAIL_HOST;
    const port = Number(process.env.MAIL_PORT || 587);
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    if (!host || !user || !pass) return null;

    return {
        host,
        port,
        secure: String(process.env.MAIL_SECURE || "").toLowerCase() === "true" || port === 465,
        auth: { user, pass },
    };
}

function createTransporter() {
    const config = getMailConfig();
    if (!config) return null;
    const nodemailer = require("nodemailer");
    return nodemailer.createTransport(config);
}

module.exports.isMailConfigured = function () {
    return Boolean(getMailConfig());
};

module.exports.sendCouponReminder = async function ({ to, name }) {
    const transporter = createTransporter();
    if (!transporter) {
        throw new Error("Mail is not configured. Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS and MAIL_FROM.");
    }

    const from = process.env.MAIL_FROM || process.env.MAIL_USER;
    const displayName = name || "Student";
    const htmlDisplayName = escapeHtml(displayName);

    await transporter.sendMail({
        from,
        to,
        subject: "Reminder: Buy next week's mess coupons before Sunday midnight",
        text: [
            `Dear ${displayName},`,
            "",
            "Our records show that you have not bought mess coupons for next week yet.",
            "If you do not buy the coupons before Sunday midnight, you will not be able to avail mess service for next week.",
            "",
            "Please buy your coupons before Sunday midnight.",
            "",
            "Regards,",
            "IIITL Mess Portal"
        ].join("\n"),
        html: `
            <p>Dear ${htmlDisplayName},</p>
            <p>Our records show that you have not bought mess coupons for next week yet.</p>
            <p><strong>If you do not buy the coupons before Sunday midnight, you will not be able to avail mess service for next week.</strong></p>
            <p>Please buy your coupons before Sunday midnight.</p>
            <p>Regards,<br/>IIITL Mess Portal</p>
        `,
    });
};
