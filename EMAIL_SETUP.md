# Email Configuration for Supabase

To ensure password reset and confirmation emails are delivered properly, you need to configure SMTP settings in your Supabase project.

## Steps to Configure Email Delivery

### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your project dashboard

### 2. Configure SMTP Settings
1. In the left sidebar, click on **Settings**
2. Click on **Auth** in the Settings menu
3. Scroll down to **SMTP Settings** section

### 3. Email Provider Options

#### Option A: Use Gmail SMTP (Recommended for testing)
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP Username: your-gmail@gmail.com
SMTP Password: your-app-password (not regular password)
Enable SSL: Yes
```

**Important**: You need to generate an App Password for Gmail:
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password specifically for this application
4. Use the App Password (not your regular Gmail password)

#### Option B: Use SendGrid (Recommended for production)
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP Username: apikey
SMTP Password: your-sendgrid-api-key
```

#### Option C: Use Amazon SES
```
SMTP Host: email-smtp.us-east-1.amazonaws.com (adjust region)
SMTP Port: 587
SMTP Username: your-ses-smtp-username
SMTP Password: your-ses-smtp-password
```

### 4. Configure Email Templates (Optional)
You can customize the email templates in the same Auth settings:
- **Confirmation Email Template**: Sent when users sign up
- **Recovery Email Template**: Sent for password resets
- **Magic Link Template**: For passwordless login (if enabled)

### 5. Set Sender Email
1. In the **SMTP Settings**, set your **Sender Email**
2. This should be an email address you own and have verified with your SMTP provider
3. Example: `noreply@yourdomain.com` or `your-gmail@gmail.com`

### 6. Test Email Delivery
After configuration:
1. Try signing up with a new email address
2. Try using the "Reset Password" button
3. Check if emails are delivered to inbox (check spam folder too)

### 7. Custom Domain (Advanced)
For production apps, consider:
1. Setting up a custom domain for emails
2. Using a dedicated email service like SendGrid, Mailgun, or AWS SES
3. Configuring SPF, DKIM, and DMARC records for better deliverability

## Troubleshooting

### Emails Going to Spam
- Use a verified sender domain
- Set up SPF, DKIM records
- Avoid spammy words in subject lines
- Use a reputable SMTP provider

### Emails Not Sending
- Check SMTP credentials are correct
- Verify the sender email is authorized with your SMTP provider
- Check Supabase logs for error messages
- Ensure firewall/network allows SMTP connections

### Rate Limiting
- Most providers have sending limits
- Gmail: ~500 emails per day
- SendGrid: Varies by plan
- Consider upgrading for higher volumes

## Security Notes
- Never commit SMTP passwords to version control
- Use environment variables or secure configuration
- Regularly rotate SMTP credentials
- Monitor email sending for abuse

## Current Status
Your app is now configured to use Supabase authentication with:
- ✅ Email/password signup and signin
- ✅ Password reset functionality  
- ✅ Email confirmation resend
- ⚠️  Email delivery needs SMTP configuration (follow steps above)

Once you complete the SMTP setup in Supabase dashboard, all email functionality will work properly.