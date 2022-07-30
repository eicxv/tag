# tag

Light-weight non-invasive web-site traffic tracking with AWS. 

Visitors are assigned a salted hash based on their ip in order to monitor user sessions. The salt is rotated daily and old salts are deleted. This ensures the ip adresses are not recoverable and that users are not tracked over time.
