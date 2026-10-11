# FarmConnect Database Diagram

```mermaid
erDiagram
    User ||--o{ Farm : has
    User ||--o{ Order : places
    User ||--o{ Review : writes
    User ||--o{ Cart : has
    User ||--o{ Wishlist : has
    User ||--o{ Message : sends
    User ||--o{ Notification : receives
    User ||--o{ Address : has
    User ||--o{ Conversation : as-buyer
    User ||--o{ Conversation : as-farmer

    Farm ||--o{ Product : has
    Farm ||--o{ FarmImage : has
    Farm ||--o{ Review : receives
    Farm ||--o{ Order : receives
    Farm ||--o{ FarmerFollower : followed
    Farm ||--o{ FarmCertificate : has
    Farm ||--o{ FarmStory : has
    Farm ||--o{ VisitBooking : has
    Farm ||--o{ HarvestCalendar : has

    Category ||--o{ Product : categorizes

    Product ||--o{ ProductImage : has
    Product ||--o{ Cart : added
    Product ||--o{ Wishlist : saved
    Product ||--o{ OrderItem : ordered
    Product ||--o{ ProductView : viewed

    Order ||--o{ OrderItem : contains
    Order ||--o| Payment : has
    Order ||--o| PickupAppointment : has
    Order ||--o| Address : uses

    Conversation ||--o{ Message : has

    User {
        string id PK
        string firstName
        string lastName
        string email UK
        string password
        string phone
        string avatar
        enum role
        boolean emailVerified
        datetime createdAt
        datetime updatedAt
    }

    Farm {
        string id PK
        string farmName
        string description
        string coverImage
        float latitude
        float longitude
        string province
        string phone
        float ratingAverage
        int totalReviews
        int followers
        boolean verified
        datetime createdAt
    }

    Product {
        string id PK
        string name
        string slug UK
        decimal price
        int stock
        string unit
        string coverImage
        float rating
        int sold
        boolean pickupAvailable
        boolean deliveryAvailable
        enum status
        datetime createdAt
    }

    Category {
        string id PK
        string name
        string slug UK
        string icon
        boolean active
    }

    Order {
        string id PK
        string orderNumber UK
        enum deliveryType
        enum status
        decimal total
        datetime createdAt
    }

    OrderItem {
        string id PK
        int quantity
        decimal price
        decimal subtotal
    }

    Review {
        string id PK
        int rating
        string comment
        string farmerReply
        datetime createdAt
    }

    Cart {
        string id PK
        int quantity
        datetime createdAt
    }

    Conversation {
        string id PK
        string lastMessage
        datetime createdAt
    }

    Message {
        string id PK
        string message
        string image
        enum messageType
        boolean isRead
        datetime createdAt
    }

    Notification {
        string id PK
        string title
        string message
        boolean isRead
        datetime createdAt
    }

    Address {
        string id PK
        string address
        string province
        string district
        string phone
        boolean isDefault
    }

    Payment {
        string id PK
        decimal amount
        enum method
        enum status
        string slipImage
    }
```

## Relationships Summary

| Model | Relations |
|-------|-----------|
| **User** | farms, orders, reviews, cart, wishlist, messages, notifications, addresses |
| **Farm** | products, farmImages, reviews, orders, followers, certificates |
| **Product** | images, cartItems, wishlistItems, orderItems, views |
| **Order** | items, payment, pickupAppointment, address |
| **Conversation** | messages, buyer (User), farmer (User) |
| **Review** | buyer (User), farm (Farm), product (Product) |

> เปิดไฟล์นี้ใน VSCode แล้วใช้ extension **Markdown Preview Mermaid Support** เพื่อดู diagram
> หรือ copy ไปที่ https://mermaid.live/edit