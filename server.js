/**
 * HelloAsso → Slack Integration
 * Reçoit les webhooks HelloAsso et envoie une notification Slack
 * à chaque vente de billet.
 */

const express = require("express");
const app = express();
app.use(express.json());

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL; // Obligatoire
const PORT = process.env.PORT || 3000;

// Compteur de billets vendus (en mémoire — remplacer par une DB pour persister)
let totalTicketsSold = 0;

// ─── ROUTE DE SANTÉ ──────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("HelloAsso → Slack webhook actif ✅"));

// ─── WEBHOOK HELLOASSO ───────────────────────────────────────────────────────
app.post("/webhook/helloasso", async (req, res) => {
  try {
    const payload = req.body;

    // HelloAsso envoie différents types d'événements
    const eventType = payload.eventType || payload.type || "";

    // On ne traite que les commandes (orders) = achats de billets
    if (!["Order", "Payment"].some((t) => eventType.includes(t))) {
      return res.status(200).json({ ignored: true, eventType });
    }

    const order = payload.data || payload;

    // ── Extraction des informations de la commande ──
    const buyerFirstName = order.payer?.firstName || order.buyer?.firstName || "Inconnu";
    const buyerLastName  = order.payer?.lastName  || order.buyer?.lastName  || "";
    const buyerEmail     = order.payer?.email     || order.buyer?.email     || "";

    // Nombre de billets dans cette commande
    const items = order.items || [];
    const ticketsInOrder = items.reduce((sum, item) => {
      return sum + (item.quantity || 1);
    }, items.length === 0 ? 1 : 0);

    // Montant total de la commande (en centimes → euros)
    const amountCents = order.amount?.total ?? order.totalAmount ?? 0;
    const amountEuros = (amountCents / 100).toFixed(2);

    // Mise à jour du compteur global
    totalTicketsSold += ticketsInOrder;

    // Nom de l'événement / campagne
    const eventName = items[0]?.name || order.formName || order.campaign?.title || "Événement";

    // ── Construction du message Slack ──
    const slackMessage = {
      text: `🎟️ Nouvelle vente sur HelloAsso !`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎟️ Nouvelle vente de billet !",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Acheteur :*\n${buyerFirstName} ${buyerLastName}` },
            { type: "mrkdwn", text: `*Email :*\n${buyerEmail || "_Non communiqué_"}` },
          ],
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Événement :*\n${eventName}` },
            { type: "mrkdwn", text: `*Montant payé :*\n${amountEuros} €` },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Billets dans cette commande :*\n*${ticketsInOrder}* billet(s)` },
            { type: "mrkdwn", text: `*Total billets vendus :*\n*${totalTicketsSold}* au total 🎉` },
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Reçu le ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
            },
          ],
        },
      ],
    };

    // ── Envoi vers Slack ──
    const slackRes = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackMessage),
    });

    if (!slackRes.ok) {
      console.error("Erreur Slack :", await slackRes.text());
      return res.status(500).json({ error: "Erreur envoi Slack" });
    }

    console.log(`✅ Vente notifiée : ${ticketsInOrder} billet(s) — Total : ${totalTicketsSold}`);
    res.status(200).json({ success: true, ticketsInOrder, totalTicketsSold });
  } catch (err) {
    console.error("Erreur webhook :", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DÉMARRAGE ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  if (!SLACK_WEBHOOK_URL) {
    console.warn("⚠️  SLACK_WEBHOOK_URL non définie ! Ajoutez-la en variable d'environnement.");
  }
});
