$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\CurrentUser\My" -FriendlyName "Neotic Local SSL"
$pwd = ConvertTo-SecureString -String "neotic" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "./server/neotic.pfx" -Password $pwd
Export-Certificate -Cert $cert -FilePath "./server/neotic.crt"
# Note: For uvicorn to use these easily, we'll use uvicorn's builtin ssl options.
# Uvicorn works better with .pem files.
# For simplicity, we'll use Next.js's built-in mkcert automation which is more standard.
