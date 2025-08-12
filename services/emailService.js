const nodemailer = require('nodemailer');
const logger = require('./logger');

// SMTP yapılandırması
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Sipariş onay e-postası gönderme 
async function sendOrderConfirmation(order) {
  try {
    const { customerInfo, paymentDetails, productName, orderNumber, createdAt } = order;
    
    // Sipariş tarihini formatla
    const orderDate = new Date(createdAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerInfo.email,
      subject: `Heart Pottery Studio - Order Confirmation #${orderNumber || 'Unknown'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #b5651d; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Order Confirmation</h1>
          </div>
          
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <p>Hello ${customerInfo.firstName || 'Valued Customer'},</p>
            
            <p>Thank you for your order with Heart Pottery Studio. Your order has been confirmed!</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h2 style="margin-top: 0; color: #333;">Order Details</h2>
              <p><strong>Order Number:</strong> ${orderNumber || 'Unknown'}</p>
              <p><strong>Date:</strong> ${orderDate}</p>
              <p><strong>Product:</strong> ${productName || 'Pottery Class'}</p>
              <p><strong>Amount:</strong> $${paymentDetails.amount.toFixed(2)} ${paymentDetails.currency.toUpperCase()}</p>
            </div>
            
            <p>We look forward to seeing you at the studio!</p>
            
            <p>If you have any questions, please contact us at info@heartpotterystudio.com.</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} Heart Pottery Studio. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Order confirmation email sent to ${customerInfo.email}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send order confirmation email: ${error.message}`);
    throw error;
  }
}

module.exports = { sendOrderConfirmation };

