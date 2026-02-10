# Checks

Before release or after schema changes:

- [ ] All migrations applied in order.
- [ ] Dashboard shows “Forecast version used” and immutability note when snapshot exists.
- [ ] Share mode (`/?share=1`): banner, How to read expanded, no Runs/Admin; Nerd link shows disabled message when clicked.
- [ ] Nerd Mode: enabling from Dashboard reveals Runs/Admin, Data Health, Receipts; persists across reloads (cookie).
- [ ] Direct visit to /runs or /admin without Nerd Mode shows gate page; with `?share=1` shows “Not available in share view.”
- [ ] Run history and run detail pages load when Nerd Mode is enabled and not in share mode.
