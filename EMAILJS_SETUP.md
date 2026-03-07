# EmailJS Setup Guide

This guide will help you configure EmailJS for sending registration and check-in confirmation emails.

## Overview

Your application sends TWO types of emails:

1. **Registration Email** - Sent automatically when someone registers for an event
   - Includes event details, date, and location
   - Confirms successful registration

2. **Check-In Email** - Sent automatically when someone checks in at the event
   - Includes check-in timestamp
   - Confirms successful check-in

Both emails use the same EmailJS service but require separate templates.

## Step 1: Create EmailJS Account

1. Go to [EmailJS](https://www.emailjs.com/) and create a free account
2. Verify your email address

## Step 2: Create Email Service

1. In the EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your chosen provider
5. Copy your **Service ID** and save it

## Step 3: Create Email Templates

You need to create two email templates:

### Registration Confirmation Template

1. Go to **Email Templates** in the EmailJS dashboard
2. Click **Create New Template**
3. Name it "Registration Confirmation"
4. Use the following template:

```
Subject: Registration Confirmed - {{event_name}}

Hi {{to_name}},

Thank you for registering for {{event_name}}!

Your registration has been successfully confirmed. Here are your event details:

Event: {{event_name}}
Date: {{event_date}}
Location: {{event_location}}

Please collect your badge at the registration help desk when you arrive.

We look forward to seeing you at the event!

Best regards,
Event Team

---
Your information is secure and will only be used for event purposes.
Developed and Built by Asterixify Innovations © 2025
```

**Template Variables:**
- `{{to_name}}` - Attendee's full name
- `{{to_email}}` - Attendee's email address (automatically handled by EmailJS)
- `{{event_name}}` - Name of the event
- `{{event_date}}` - Date of the event
- `{{event_location}}` - Event location

Save the template and copy the **Template ID**.

### Check-In Confirmation Template

1. Create another new template
2. Name it "Check-In Confirmation"
3. Use the following template:

```
Subject: Successfully Checked In - {{event_name}}

Hi {{to_name}},

You have been successfully checked in to {{event_name}}!

Check-In Time: {{checked_in_at}}

Please collect your badge at the registration help desk if you haven't already.

Thank you for attending!

Best regards,
Event Team

---
Your information is secure and will only be used for event purposes.
Developed and Built by Asterixify Innovations © 2025
```

**Template Variables:**
- `{{to_name}}` - Attendee's full name
- `{{to_email}}` - Attendee's email address (automatically handled by EmailJS)
- `{{event_name}}` - Name of the event
- `{{checked_in_at}}` - Check-in date and time

Save the template and copy the **Template ID**.

## Step 4: Get Your Public Key

1. Go to **Account** > **General** in the EmailJS dashboard
2. Find your **Public Key** (it looks like a string of random characters)
3. Copy it

## Step 5: Update Environment Variables

Open your `.env` file and replace the placeholder values with your actual credentials:

```
VITE_EMAILJS_SERVICE_ID=service_22havjr
VITE_EMAILJS_PUBLIC_KEY=0NSEYeRVI3yol-JvM
VITE_EMAILJS_REGISTRATION_TEMPLATE_ID=template_2t34kbz
VITE_EMAILJS_CHECKIN_TEMPLATE_ID=your_checkin_template_id_here
```

**IMPORTANT:** You need TWO separate template IDs:
1. **Registration Template ID** - For sending confirmation emails when someone registers
2. **Check-In Template ID** - For sending confirmation emails when someone checks in at the event

Both templates use the same service and public key, but different template IDs because they send different email content.

## Step 6: Restart Development Server

After updating the `.env` file, restart your development server for the changes to take effect.

## Quick Setup Summary

To complete your EmailJS setup, you need to:

1. Create a second email template in EmailJS for check-in confirmations
2. Copy the Check-In Template ID from EmailJS
3. Update the `.env` file with your Check-In Template ID:
   ```
   VITE_EMAILJS_CHECKIN_TEMPLATE_ID=your_checkin_template_id_here
   ```

Once complete, your `.env` file should look like this:
```
VITE_EMAILJS_SERVICE_ID=service_22havjr
VITE_EMAILJS_PUBLIC_KEY=0NSEYeRVI3yol-JvM
VITE_EMAILJS_REGISTRATION_TEMPLATE_ID=template_2t34kbz
VITE_EMAILJS_CHECKIN_TEMPLATE_ID=template_xxxxx  ← Replace with your actual check-in template ID
```

## Testing

1. Register a new attendee - they should receive a registration confirmation email
2. Check in an attendee - they should receive a check-in confirmation email

## Troubleshooting

- **Emails not sending**: Check that all environment variables are correctly set
- **Wrong email content**: Verify template variables match exactly as shown above
- **Service errors**: Ensure your EmailJS service is properly configured and connected

## Email Template Customization

You can customize the email templates in the EmailJS dashboard to match your branding:
- Add your logo
- Change colors and styling
- Modify the message content
- Add additional information

Remember to keep the template variable names (like `{{to_name}}`) exactly as shown, as these are used by the application to populate the email content.
