# Deployment

FleetCast NYC should live at `fleetcast.meetgandhi.com` so the root portfolio can stay on `meetgandhi.com`.

## One-Time Auth

PowerShell blocks the `vercel.ps1` shim on this machine, so use `vercel.cmd`:

```powershell
vercel.cmd login
```

After that succeeds, these commands can be run by Codex without another browser login.

## Project And Production Deploy

```powershell
cd "C:\Users\gandh\OneDrive\Documents\Random Stuff\fleetcast-nyc"
vercel.cmd project add fleetcast-nyc --scope gandhimeetmg-6414s-projects
vercel.cmd link --yes --project fleetcast-nyc --scope gandhimeetmg-6414s-projects
vercel.cmd --prod --yes --scope gandhimeetmg-6414s-projects
```

Save the production deployment hostname printed by the last command.

## Custom Domain

```powershell
vercel.cmd domains add fleetcast.meetgandhi.com fleetcast-nyc --scope gandhimeetmg-6414s-projects
vercel.cmd alias set <deployment-hostname> fleetcast.meetgandhi.com --scope gandhimeetmg-6414s-projects
```

If Vercel asks for DNS configuration at the registrar, add this record:

```text
Type: CNAME
Name: fleetcast
Value: cname.vercel-dns.com
```

Then rerun the `domains add` and `alias set` commands after DNS propagates.
