# 🎟️ HelloAsso → Slack Integration

Reçoit les webhooks HelloAsso et envoie une notification Slack à chaque vente de billet,
avec le nombre de billets de la commande et le total cumulé.

---

## ⚡ Installation rapide

```bash
npm install
```

---

## 🔧 Configuration

### 1. Créer un Incoming Webhook Slack

1. Aller sur https://api.slack.com/apps
2. **Create New App** → **From scratch**
3. Donner un nom (ex: _HelloAsso Bot_) et choisir votre workspace
4. Dans le menu de gauche : **Incoming Webhooks** → activer
5. Cliquer **Add New Webhook to Workspace** → choisir le canal
6. **Copier l'URL** du webhook (commence par `https://hooks.slack.com/services/...`)

### 2. Configurer la variable d'environnement

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ"
```

Ou créer un fichier `.env` :
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ
PORT=3000
```

### 3. Démarrer le serveur

```bash
npm start
```

---

## 🌐 Déploiement (rendre le serveur accessible depuis Internet)

HelloAsso a besoin d'une URL publique pour envoyer ses webhooks.
Options recommandées :

| Option | Facilité | Coût |
|--------|----------|------|
| **Railway.app** | ⭐⭐⭐ Très facile | Gratuit (500h/mois) |
| **Render.com** | ⭐⭐⭐ Très facile | Gratuit |
| **Fly.io** | ⭐⭐ Moyen | Gratuit |
| **VPS perso** | ⭐ Avancé | ~5€/mois |

**Pour Railway (recommandé) :**
1. Pousser ce dossier sur GitHub
2. Aller sur [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Ajouter la variable `SLACK_WEBHOOK_URL` dans les **Variables** du projet
4. Railway vous donne une URL publique du type `https://xxx.railway.app`

---

## 🔗 Configurer le webhook HelloAsso

1. Connectez-vous sur [admin.helloasso.com](https://admin.helloasso.com)
2. Aller dans **Paramètres** → **API & Webhooks**
3. Ajouter un nouveau webhook :
   - **URL** : `https://votre-serveur.railway.app/webhook/helloasso`
   - **Événements** : cocher `Order` (commandes)
4. Sauvegarder

---

## 📨 Exemple de notification Slack

```
🎟️ Nouvelle vente de billet !

Acheteur : Marie Dupont
Email : marie@exemple.fr

Événement : Gala de fin d'année
Montant payé : 25.00 €

━━━━━━━━━━━━━━━━━━━━
Billets dans cette commande : 2 billet(s)
Total billets vendus : 47 au total 🎉

Reçu le 05/05/2026 à 14:32:15
```

---

## 🛠️ Tester en local

Utilisez [ngrok](https://ngrok.com) pour exposer votre serveur local temporairement :

```bash
# Terminal 1
npm start

# Terminal 2
ngrok http 3000
# → Copier l'URL https://xxxx.ngrok.io et la coller dans HelloAsso
```

Puis simuler un webhook :
```bash
curl -X POST http://localhost:3000/webhook/helloasso \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "Order",
    "data": {
      "payer": { "firstName": "Marie", "lastName": "Dupont", "email": "marie@test.fr" },
      "amount": { "total": 2500 },
      "items": [{ "name": "Billet soirée", "quantity": 2 }]
    }
  }'
```
