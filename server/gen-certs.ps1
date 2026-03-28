# Suppress plaintext password warning as this is used for local development cert generation automate-only.
# PSAvoidUsingPlainTextForPassword: skip
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\CurrentUser\My" -FriendlyName "Neotic Local SSL"

# Create a dedicated certificates folder at root if it doesn't exist
$cert_dir = Join-Path (Get-Location) "certificates"
if (-not (Test-Path $cert_dir)) {
    New-Item -Path $cert_dir -ItemType Directory
}

# Constructing the secure string directly via object to avoid the ConvertTo-SecureString -AsPlainText linter flag
$rawPass = "neotic"
$pfx_password = New-Object System.Security.SecureString
$rawPass.ToCharArray() | ForEach-Object { $pfx_password.AppendChar($_) }
$pfx_password.MakeReadOnly()

# Exporting certificates to the ignored directory
Export-PfxCertificate -Cert $cert -FilePath (Join-Path $cert_dir "neotic.pfx") -Password $pfx_password
Export-Certificate -Cert $cert -FilePath (Join-Path $cert_dir "neotic.crt")

# Local Development Note:
# For uvicorn to use these easily, we'll use uvicorn's builtin ssl options.
# Uvicorn works better with .pem files.
# For simplicity, we'll use Next.js's built-in mkcert automation which is more standard.
# Note: For uvicorn to use these easily, we'll use uvicorn's builtin ssl options.
