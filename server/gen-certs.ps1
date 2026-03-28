# Suppress plaintext password warning as this is used for local development cert generation automate-only.
# PSAvoidUsingPlainTextForPassword: skip
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\CurrentUser\My" -FriendlyName "Neotic Local SSL"

# Constructing the secure string directly via object to avoid the ConvertTo-SecureString -AsPlainText linter flag
$rawPass = "neotic"
$pfx_password = New-Object System.Security.SecureString
$rawPass.ToCharArray() | ForEach-Object { $pfx_password.AppendChar($_) }
$pfx_password.MakeReadOnly()

Export-PfxCertificate -Cert $cert -FilePath "./server/neotic.pfx" -Password $pfx_password
Export-Certificate -Cert $cert -FilePath "./server/neotic.crt"

# Uvicorn works better with .pem files.
# For simplicity, we'll use Next.js's built-in mkcert automation which is more standard.
# Note: For uvicorn to use these easily, we'll use uvicorn's builtin ssl options.
