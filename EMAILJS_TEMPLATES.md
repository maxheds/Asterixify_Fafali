# EmailJS Template Setup Guide

This document contains the HTML templates for both registration and check-in emails. Use the **Code Editor** in EmailJS to paste these templates.

---

## Registration Email Template (template_2t34kbz)

### Template Variables:
- `{{salutation}}` - Mr., Mrs., Ms., Dr., Prof., etc.
- `{{first_name}}` - Attendee's first name
- `{{last_name}}` - Attendee's last name
- `{{to_email}}` - Attendee's email address
- `{{event_name}}` - Name of the event
- `{{event_date}}` - Full formatted date of the event
- `{{event_location}}` - Event location or TBA

### HTML Template Code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Registration Confirmation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #475569;
            margin-bottom: 25px;
        }
        .event-details {
            background-color: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .event-details h2 {
            margin: 0 0 15px 0;
            font-size: 20px;
            color: #1e293b;
        }
        .detail-row {
            display: flex;
            margin-bottom: 10px;
            font-size: 15px;
        }
        .detail-label {
            font-weight: 600;
            color: #334155;
            min-width: 80px;
        }
        .detail-value {
            color: #475569;
        }
        .important-note {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 15px;
            margin: 25px 0;
            font-size: 14px;
            color: #78350f;
        }
        .footer {
            background-color: #f8fafc;
            padding: 25px 30px;
            text-align: center;
            font-size: 13px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
        }
        .brand {
            color: #2563eb;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Hello {{salutation}} {{first_name}} {{last_name}},
            </div>

            <div class="message">
                Thank you for registering! We're excited to confirm your registration for the upcoming event. Your spot has been reserved and we look forward to seeing you there.
            </div>

            <div class="event-details">
                <h2>📅 Event Details</h2>
                <div class="detail-row">
                    <div class="detail-label">Event:</div>
                    <div class="detail-value">{{event_name}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Date:</div>
                    <div class="detail-value">{{event_date}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Location:</div>
                    <div class="detail-value">{{event_location}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{to_email}}</div>
                </div>
            </div>

            <div class="important-note">
                <strong>⚠️ Important:</strong> Please save this email for your records. You may be asked to present it at the event check-in.
            </div>

            <div class="message">
                If you have any questions or need to make changes to your registration, please contact the event organizers.
            </div>
        </div>

        <div class="footer">
            <p>This is an automated confirmation email.</p>
            <p>Developed and Built by <span class="brand">Asterixify Innovations</span> © 2025</p>
        </div>
    </div>
</body>
</html>
```

---

## Check-In Email Template (template_0fyprvu)

### Template Variables:
- `{{salutation}}` - Mr., Mrs., Ms., Dr., Prof., etc.
- `{{first_name}}` - Attendee's first name
- `{{last_name}}` - Attendee's last name
- `{{to_email}}` - Attendee's email address
- `{{event_name}}` - Name of the event
- `{{checked_in_at}}` - Date and time of check-in

### HTML Template Code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Check-In Confirmation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #475569;
            margin-bottom: 25px;
        }
        .checkin-details {
            background-color: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .checkin-details h2 {
            margin: 0 0 15px 0;
            font-size: 20px;
            color: #1e293b;
        }
        .detail-row {
            display: flex;
            margin-bottom: 10px;
            font-size: 15px;
        }
        .detail-label {
            font-weight: 600;
            color: #334155;
            min-width: 120px;
        }
        .detail-value {
            color: #475569;
        }
        .success-badge {
            background-color: #dcfce7;
            border: 2px solid #16a34a;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .success-badge .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .success-badge .text {
            font-size: 18px;
            font-weight: 600;
            color: #15803d;
        }
        .footer {
            background-color: #f8fafc;
            padding: 25px 30px;
            text-align: center;
            font-size: 13px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
        }
        .brand {
            color: #16a34a;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Check-In Successful!</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Welcome, {{salutation}} {{first_name}} {{last_name}}!
            </div>

            <div class="success-badge">
                <div class="icon">🎉</div>
                <div class="text">You have been successfully checked in!</div>
            </div>

            <div class="message">
                Thank you for attending! We're delighted to have you with us at this event.
            </div>

            <div class="checkin-details">
                <h2>📋 Check-In Details</h2>
                <div class="detail-row">
                    <div class="detail-label">Event:</div>
                    <div class="detail-value">{{event_name}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Checked In At:</div>
                    <div class="detail-value">{{checked_in_at}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{to_email}}</div>
                </div>
            </div>

            <div class="message">
                We hope you have a wonderful experience at the event. If you need any assistance, please don't hesitate to reach out to our event staff.
            </div>
        </div>

        <div class="footer">
            <p>This is an automated check-in confirmation email.</p>
            <p>Developed and Built by <span class="brand">Asterixify Innovations</span> © 2025</p>
        </div>
    </div>
</body>
</html>
```

---

## Setup Instructions for EmailJS

### For Registration Template (template_2t34kbz):
1. Go to your EmailJS dashboard
2. Select the service: `service_22havjr`
3. Click on Templates and find `template_2t34kbz`
4. Click "Edit Template"
5. Switch to "Code Editor" mode
6. Paste the Registration Email HTML template code above
7. Make sure to set the "To Email" field to: `{{to_email}}`
8. Save the template

### For Check-In Template (template_0fyprvu):
1. Go to your EmailJS dashboard
2. Select the service: `service_22havjr`
3. Click on Templates and find `template_0fyprvu`
4. Click "Edit Template"
5. Switch to "Code Editor" mode
6. Paste the Check-In Email HTML template code above
7. Make sure to set the "To Email" field to: `{{to_email}}`
8. Save the template

---

## Important Notes

1. **Template Variables**: Both templates use the following variables that are sent from the application:
   - Registration: `salutation`, `first_name`, `last_name`, `to_email`, `event_name`, `event_date`, `event_location`
   - Check-In: `salutation`, `first_name`, `last_name`, `to_email`, `event_name`, `checked_in_at`

2. **Responsive Design**: Both templates are mobile-friendly and will display correctly on all devices.

3. **Customization**: Feel free to modify the colors, fonts, or text to match your branding. The current design uses:
   - Registration: Blue theme (#2563eb)
   - Check-In: Green theme (#16a34a)

4. **Testing**: After setting up the templates, test them by registering for an event or checking in to ensure emails are sent correctly.
