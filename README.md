# Charming Lane

Static shop website. No build step: open `index.html` in a browser.

## Add your images

Put these files in `assets/`:

| File | What |
| --- | --- |
| `assets/logo.png` | Your logo (square) |
| `assets/cover.png` | Your Facebook cover photo (3:2) |
| `assets/products/*.jpg` | Product photos (4:5 portrait works best) |

Until you add them, the site shows a pastel banner with the tagline and a bow placeholder on each item.

Product photos are shown in a 4:5 (portrait) frame, so crop or shoot them about 4 wide by 5 tall.

## Set up

1. `js/config.js`: set your Facebook page name, Instagram username, currency code (for example `PHP`) and locale.
2. `js/products.js`: replace the sample products with yours. Set `image` to the photo path, for example `"assets/products/pearl-necklace.jpg"`. Items are grouped by `category` automatically.

## Changing categories

Categories are not fixed. Each product's `category` text in `js/products.js` creates the section on the shop page. To add, rename or remove a category, edit that text on the items. Sections appear in the order of their first item in the file.

## How ordering works

Customers add items to a bag. "Copy order and open Messenger" (or Instagram) copies a ready-made order message and opens your chat. They paste it and send. You confirm the shipping fee and payment in the chat.

Messenger and Instagram links cannot pre-fill the message text, which is why the message is copied to the clipboard.

## Sharing an item

Opening an item adds `?item=<id>` to the address, so you can post a link that opens that item directly.

## Publish for free

Upload the folder to Netlify (drag and drop), GitHub Pages or Vercel. Then put the link in your Facebook and Instagram bios.
