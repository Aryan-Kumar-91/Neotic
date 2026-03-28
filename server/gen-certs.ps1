# Suppress plaintext password warning as this is used for local development cert generation automate-only.
# PSAvoidUsingPlainTextForPassword: skip
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\CurrentUser\My" -FriendlyName "Neotic Local SSL"
$pfx_pass = "neotic"
$pfx_password = ConvertTo-SecureString -String $pfx_pass -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "./server/neotic.pfx" -Password $pfx_password
Export-Certificate -Cert $cert -FilePath "./server/neotic.crt"

# Uvicorn works better with .pem files.
# For simplicity, we'll use Next.js's built-in mkcert automation which is more standard.
# Note: For uvicorn to use these easily, we'll use uvicorn's builtin ssl options.
