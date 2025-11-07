# DNS Configuration Guide for Circuvent Mail

## Overview

To enable your custom email domains (@circuvent.com and @htresearchlab.com) to send and receive emails from/to ANY domain (Gmail, Yahoo, Outlook, etc.), you MUST configure proper DNS records.

## Required DNS Records

### 1. MX Records (Mail Exchange) - HIGHEST PRIORITY

MX records tell other mail servers where to deliver emails for your domain.

**For circuvent.com:**
```
Type: MX
Host: @ (or circuvent.com)
Priority: 10
Value: mail.htresearchlab.com
TTL: 3600
```

**For htresearchlab.com:**
```
Type: MX
Host: @ (or htresearchlab.com)
Priority: 10
Value: mail.htresearchlab.com
TTL: 3600
```

### 2. A Record (Address Record)

Points your mail server hostname to your server's IP address.

```
Type: A
Host: mail
Domain: htresearchlab.com
Value: <YOUR_SERVER_IP_ADDRESS>
TTL: 3600
```

Example: If your server IP is 203.0.113.45:
```
mail.htresearchlab.com → 203.0.113.45
```

### 3. SPF Record (Sender Policy Framework)

SPF prevents email spoofing by specifying which servers can send emails from your domain.

**For circuvent.com:**
```
Type: TXT
Host: @ (or circuvent.com)
Value: v=spf1 ip4:<YOUR_SERVER_IP> mx ~all
TTL: 3600
```

**For htresearchlab.com:**
```
Type: TXT
Host: @ (or htresearchlab.com)
Value: v=spf1 ip4:<YOUR_SERVER_IP> mx ~all
TTL: 3600
```

Example:
```
v=spf1 ip4:203.0.113.45 mx ~all
```

### 4. DKIM Record (DomainKeys Identified Mail)

DKIM adds a digital signature to your emails to verify authenticity.

#### Step 1: Generate DKIM Keys

On your server:
```bash
# Generate private key
openssl genrsa -out dkim_private.pem 2048

# Generate public key
openssl rsa -in dkim_private.pem -pubout -out dkim_public.pem

# Extract public key content (remove headers and newlines)
cat dkim_public.pem | grep -v "BEGIN PUBLIC KEY" | grep -v "END PUBLIC KEY" | tr -d '\n'
```

#### Step 2: Add DKIM DNS Record

**For circuvent.com:**
```
Type: TXT
Host: default._domainkey
Domain: circuvent.com
Value: v=DKIM1; k=rsa; p=<YOUR_PUBLIC_KEY>
TTL: 3600
```

**For htresearchlab.com:**
```
Type: TXT
Host: default._domainkey
Domain: htresearchlab.com
Value: v=DKIM1; k=rsa; p=<YOUR_PUBLIC_KEY>
TTL: 3600
```

Example:
```
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

### 5. DMARC Record (Domain-based Message Authentication)

DMARC builds on SPF and DKIM to provide email authentication policy.

**For circuvent.com:**
```
Type: TXT
Host: _dmarc
Domain: circuvent.com
Value: v=DMARC1; p=quarantine; rua=mailto:admin@circuvent.com; ruf=mailto:admin@circuvent.com; fo=1
TTL: 3600
```

**For htresearchlab.com:**
```
Type: TXT
Host: _dmarc
Domain: htresearchlab.com
Value: v=DMARC1; p=quarantine; rua=mailto:admin@htresearchlab.com; ruf=mailto:admin@htresearchlab.com; fo=1
TTL: 3600
```

### 6. PTR Record (Reverse DNS) - IMPORTANT

PTR records map your IP address back to your domain. Contact your hosting provider to set this up.

```
IP: <YOUR_SERVER_IP>
PTR: mail.htresearchlab.com
```

## Configuration by DNS Provider

### GoDaddy

1. Login to GoDaddy
2. Go to "My Products" > "DNS"
3. Click "Add" for each record
4. Select record type (MX, A, TXT)
5. Fill in Host, Value, Priority (for MX)
6. Save

### Cloudflare

1. Login to Cloudflare
2. Select your domain
3. Go to "DNS" tab
4. Click "Add record"
5. Select type, enter name and content
6. For mail records, turn off proxy (gray cloud)
7. Save

### Namecheap

1. Login to Namecheap
2. Domain List > Manage > Advanced DNS
3. Add New Record
4. Select type, Host, Value, Priority
5. Save

### Google Domains

1. Login to Google Domains
2. Select domain > DNS
3. Custom resource records
4. Add each record with type, name, data
5. Save

## Verification

### 1. Check MX Records

```bash
# Linux/Mac
nslookup -type=mx circuvent.com
nslookup -type=mx htresearchlab.com

# Windows PowerShell
Resolve-DnsName -Name circuvent.com -Type MX
Resolve-DnsName -Name htresearchlab.com -Type MX
```

Should return: `mail.htresearchlab.com`

### 2. Check A Record

```bash
nslookup mail.htresearchlab.com
```

Should return your server IP.

### 3. Check SPF Record

```bash
nslookup -type=txt circuvent.com
```

Should include `v=spf1 ip4:...`

### 4. Check DKIM Record

```bash
nslookup -type=txt default._domainkey.circuvent.com
```

Should return `v=DKIM1; k=rsa; p=...`

### 5. Check DMARC Record

```bash
nslookup -type=txt _dmarc.circuvent.com
```

Should return `v=DMARC1; p=...`

### 6. Online Tools

Use these tools to verify your configuration:

- **MXToolbox**: https://mxtoolbox.com/
  - Enter your domain to check all email-related DNS records
  
- **DMARC Analyzer**: https://www.dmarcanalyzer.com/
  - Verify DMARC configuration
  
- **Mail Tester**: https://www.mail-tester.com/
  - Send a test email to check spam score

## Port Configuration

### Firewall Rules

Open these ports on your server:

```bash
# SMTP (Receiving)
Port 25 (TCP) - Standard SMTP
Port 2525 (TCP) - Alternative SMTP (your custom server)

# SMTP Submission (Sending)
Port 587 (TCP) - SMTP with STARTTLS

# IMAP (if implemented later)
Port 993 (TCP) - IMAP over SSL

# HTTP/HTTPS (Web interface)
Port 80 (TCP) - HTTP
Port 443 (TCP) - HTTPS
```

**Ubuntu/Debian:**
```bash
sudo ufw allow 25/tcp
sudo ufw allow 2525/tcp
sudo ufw allow 587/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**CentOS/RHEL:**
```bash
sudo firewall-cmd --permanent --add-port=25/tcp
sudo firewall-cmd --permanent --add-port=2525/tcp
sudo firewall-cmd --permanent --add-port=587/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## SSL/TLS Configuration

### Option 1: Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d mail.htresearchlab.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Option 2: Manual Certificate

1. Purchase SSL certificate from provider
2. Place cert files in `/etc/ssl/certs/`
3. Update nginx/Apache configuration

## Testing Email Delivery

### 1. Send Test Email

Login to your mail system and send to:
- Your Gmail account
- Yahoo Mail account
- Outlook account

### 2. Check Spam Folder

If emails land in spam:
- Verify SPF, DKIM, DMARC are configured
- Check PTR record exists
- Warm up your IP (send gradually increasing volume)

### 3. Check Email Headers

In received email, view full headers and check for:
- SPF: PASS
- DKIM: PASS
- DMARC: PASS

## Troubleshooting

### Emails Not Received

1. **Check MX Records**
   ```bash
   dig mx circuvent.com +short
   ```
   
2. **Test SMTP Connection**
   ```bash
   telnet mail.htresearchlab.com 25
   ```

3. **Check Server Logs**
   ```bash
   tail -f /var/log/mail.log
   ```

### Emails Going to Spam

1. **Verify DNS Records**
   - Use MXToolbox to check all records
   
2. **Check IP Reputation**
   - Visit: https://www.senderscore.org/
   - Check if IP is blacklisted: https://mxtoolbox.com/blacklists.aspx
   
3. **Implement DMARC Policy**
   - Start with `p=none` to monitor
   - Gradually move to `p=quarantine` then `p=reject`

### DNS Propagation Delay

DNS changes can take 24-48 hours to propagate globally.

Check propagation status: https://www.whatsmydns.net/

### Cannot Send to Gmail/Outlook

1. **Gmail Postmaster Tools**: https://postmaster.google.com/
   - Add your domain to monitor reputation
   
2. **Microsoft SNDS**: https://sendersupport.olc.protection.outlook.com/snds/
   - Monitor your IP reputation with Microsoft

## Production Checklist

- [ ] MX records configured for both domains
- [ ] A record points mail subdomain to server IP
- [ ] SPF record added
- [ ] DKIM keys generated and DNS record added
- [ ] DMARC record configured
- [ ] PTR record set (contact hosting provider)
- [ ] Firewall ports opened
- [ ] SSL/TLS certificate installed
- [ ] Test email sent to Gmail, Yahoo, Outlook
- [ ] Email headers verified (SPF, DKIM, DMARC pass)
- [ ] IP not blacklisted
- [ ] Monitoring setup for email delivery rates

## Support Resources

- **DNS Checker**: https://dnschecker.org/
- **SPF Wizard**: https://www.spfwizard.net/
- **DKIM Validator**: https://dkimvalidator.com/
- **Email Deliverability**: https://www.mail-tester.com/

---

**Important**: DNS configuration is CRITICAL for email delivery. Without proper DNS records, your emails will be rejected or marked as spam by other mail servers.
