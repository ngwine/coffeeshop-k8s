import React, { useState } from "react";
import "./recentpost.css";

const posts = [
  {
    id: 1,
    img: "/images/coffee1.jpg",
    title: "How to recognize the flavor of pure Robusta coffee",
    date: "August 28, 2025",
    author: "WorkDo Coffee",
    desc: "A few simple tips to identify authentic Robusta and avoid blends.",
    content: `
Robusta is one of the two most popular coffee varieties in Vietnam, famous for its thick body, strong bitterness, and high caffeine content.

Some signs to recognize pure Robusta:
- Roasted beans are dark brown with little oil sheen (depending on roast level).
- When brewed, the crema layer is thick and stays on the surface for a long time.
- The aroma is not too acidic, leaning toward sweet notes of chocolate, wood, and roasted nuts.

When buying coffee, you should:
- Prefer roasters that roast in small batches and clearly state the roast date.
- Avoid coffee that has been pre-ground and stored for a long time.
- Try brewing with different water ratios to better feel the flavor.

If you want to experience pure Robusta, try starting with a French Press or a traditional Vietnamese phin to fully enjoy the body of the coffee.
    `,
  },
  {
    id: 2,
    img: "/images/coffee3.jpg",
    title: "Finding old Saigon in modern drinks for the young generation",
    date: "September 15, 2025",
    author: "WorkDo Coffee",
    desc: "An interesting combination of iced milk coffee, 'bac xiu' and new-style brewing.",
    content: `
Drinks like iced milk coffee, "bac xiu", and iced black coffee have long been familiar to people in Saigon.

Nowadays, young baristas give them a twist:
- Adding layers of fresh milk, cheese foam, or caramel.
- Using large ice cubes to keep the drink cold longer without diluting the flavor.
- Combining toppings such as flan, coffee jelly, or whipped cream.

Though the appearance is more modern, the original flavor of old Saigon coffee is still preserved:
- Strong, sweet, and creamy.
- One sip immediately brings back the memory of that morning coffee at the alley corner.

Thanks to that, young people get a new experience while still feeling the "soul" of old Saigon in every cup.
    `,
  },
  {
    id: 3,
    img: "/images/coffee2.jpg",
    title: "Revealing the ideal temperature for rich and tasty coffee",
    date: "October 2, 2025",
    author: "WorkDo Coffee",
    desc: "Water temperature is a crucial factor but often overlooked.",
    content: `
The ideal water temperature for brewing coffee is usually between 90–96°C, depending on:
- Brewing method.
- Roast level.
- Bean type (Arabica/Robusta/Blend).

Some quick suggestions:
- Pour-over (V60, Kalita): 92–94°C.
- French Press: 90–92°C.
- Vietnamese phin: 92–95°C.
- Espresso: the machine usually adjusts automatically, around 90–96°C.

If the water is too hot:
- It tends to extract more bitterness and astringency.
- Aroma dissipates quickly.

If the water is too cool:
- The coffee becomes weak and lacks body.
- The aroma does not fully bloom.

A small tip: after the water boils, wait about 1–2 minutes before pouring, or use a thermometer to be more precise.
    `,
  },
  {
    id: 4,
    img: "/images/coffee4.jpg",
    title: "Arabica and Robusta – two personalities, two unique experiences",
    date: "October 10, 2025",
    author: "WorkDo Coffee",
    desc: "A quick comparison to choose the right beans for your taste.",
    content: `
Arabica and Robusta are the two main coffee species, each with a very distinct personality:

Arabica:
- Rich aroma (fruity, floral, chocolate).
- Bright acidity with a sweet aftertaste.
- Lower caffeine content.
- Often used for pour-over and specialty espresso.

Robusta:
- Thick body with a pronounced bitterness.
- Simpler aroma, leaning toward wood and dark chocolate.
- High caffeine for a strong wake-up effect.
- Suitable for milk coffee and traditional phin.

Many roasteries today choose to blend Arabica & Robusta:
- To achieve both complex aroma.
- And keep the body and satisfying "kick" of Vietnamese coffee.

Depending on your mood and habits, you can absolutely have two types of beans for two different styles in a day.
    `,
  },
];

const RecentPosts = () => {
  const [selectedPost, setSelectedPost] = useState(null);

  const openPost = (post) => {
    setSelectedPost(post);
  };

  const closePost = () => {
    setSelectedPost(null);
  };

  return (
    <>
      <section
        className="recent-posts"
        style={{
          backgroundImage: `url('/images/origin-bg.png')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <div className="container">
          <div className="blog-layout">
            {/* Left section - Dark background with title and description */}
            <div className="blog-intro">
              <div className="intro-content">
                <h1 className="bg-text">Blogs</h1>
                <span className="intro-label">LATEST BLOGS</span>
                <h2>Fresh roasted coffee blogs</h2>
                <p>
                  Coffee is a beverage brewed from the roasted and ground seeds
                  of the tropical evergreen coffee plant.
                </p>
                <button
                  type="button"
                  className="show-blogs"
                  onClick={() => openPost(posts[0])}
                >
                  View featured post
                </button>
              </div>
            </div>

            {/* Right section - Light background with blog cards */}
            <div className="blog-cards">
              <button
                className="nav-arrow"
                type="button"
                // placeholder for slider later, currently just a "fake" button
                onClick={() => openPost(posts[0])}
              >
                {"<"}
              </button>

              <div className="cards-container">
                {posts.slice(0, 2).map((post) => (
                  <div
                    className="post-card"
                    key={post.id}
                    onClick={() => openPost(post)}
                  >
                    <div className="post-image">
                      <img src={post.img} alt={post.title} />
                      <div className="date-badge">{post.date}</div>
                    </div>
                    <div className="post-content">
                      <span className="post-author">{post.author}</span>
                      <h3>{post.title}</h3>
                      <p>{post.desc}</p>
                      <button
                        type="button"
                        className="read-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPost(post);
                        }}
                      >
                        READ MORE
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="nav-arrow"
                type="button"
                onClick={() => openPost(posts[1])}
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedPost && (
        <div className="post-modal-overlay" onClick={closePost}>
          <div
            className="post-modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              className="post-modal-close"
              type="button"
              onClick={closePost}
            >
              ×
            </button>

            <div className="post-modal-header">
              <span className="post-modal-date">{selectedPost.date}</span>
              <span className="post-modal-dot">•</span>
              <span className="post-modal-author">{selectedPost.author}</span>
            </div>

            <h2 className="post-modal-title">{selectedPost.title}</h2>

            <div className="post-modal-image-wrapper">
              <img src={selectedPost.img} alt={selectedPost.title} />
            </div>

            <div className="post-modal-content">
              {selectedPost.content
                .trim()
                .split("\n\n")
                .map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecentPosts;
