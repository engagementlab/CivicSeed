# Troubleshooting

Put Q&A related to weird problems here.

### civicseed.org is down

#### Looks like the server can't find the Database server?

Test this out and see if `out.log` ends on "Starting Database Services" and `err.log` has a line of error that says `CONNECTION ERROR:  [Error: failed to connect to [localhost:27017]]`.

This happens when the server uses the default environment configuration, which happens when the `NODE_ENV` environment variable is missing. This could also mean that all the environment variables are missing. The Amazon S3 server has been known to reset environment variables (cause is unknown). If this is true, reset all the environment variables and restart the server.

