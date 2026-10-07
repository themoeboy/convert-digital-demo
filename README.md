The lookbook section shows a featured image, a short description and a carousel of products (image, title, price). There are two versions of the section:

 **Lookbook** 
  - Available on Homepage 
  - Displays the lookbook entry you pick in the section settings


 **Product lookbook**
  - Available on Product pages
  - Up to 2 lookbooks whose product list contains the product being viewed, found automatically



## Adding lookbook entries

Go to **Content → Metaobjects → Lookbook → Add entry** and fill in:

- **Title**, for example `Chef`
- **Description**, for example `Create the look of a chef. Every single piece…`
- **Featured image**
- **Products**: add the products that make up the look.

> **On product pages:** a product shows the lookbooks whose **Products** list includes it. If it's in more than two, only the first two are shown, in the order the Storefront API returns the entries.

---

## Adding the section to a template

### Homepage

1. In the theme editor, open the **Home page** template.
2. **Add section → Lookbook**.
3. Configure it:

| Setting | Description |
|---|---|
| Heading | Section heading above the lookbook |
| Lookbook entry | The lookbook to display |
| Background color | Optional section background |
| Width | Page width or full width |
| Padding: Top / Bottom | Vertical spacing |

### Product pages

1. In the theme editor, open the **Default product** template, or any product template.
2. **Add section → Product lookbook**.
3. Configure **Heading**, **Background color**, **Width** and **Padding**. There is no lookbook picker, because the lookbooks are found automatically from the current product.

