
import React from 'react';
import '../Menu/menu.css';

const Menu = () => {
  const menuItems = [
    { name: "CAFFE LATTE", price: "$2.95", desc: "Fresh brewed coffee and steamed milk", new: true },
    { name: "CAFFE MOCHA", price: "$3.67", desc: "Espresso With Milk, and Whipped Cream" },
    { name: "WHITE CHOCOLATE MOCHA", price: "$2.79", desc: "Espresso, White Chocolate, Milk, Ice and Cream" },
    { name: "CAFFE AMERICANO", price: "$3.06", desc: "Espresso Shots and Light Layer of Crema" },
    { name: "CAPPUCCINO", price: "$4.03", desc: "Espresso, and Smoothed Layer of Foam" },
    { name: "VANILLA LATTE", price: "$3.65", desc: "Espresso Milk With Flavor,and Cream" },

    { name: "ICED CARAMEL LATTE", price: "$4.67", desc: "Espresso, Milk, Ice and Caramel Sauce" },
    { name: "ESPRESSO MACCHIATO", price: "$2.98", desc: "Rich Espresso With Milk and Foam" },
    { name: "CARAMEL MACCHIATO", price: "$2.54", desc: "Espresso, vanilla-flavored syrup and milk" },
    { name: "ICED SMOKED LATTE", price: "$3.05", desc: "Espresso, ice, with smoked butterscotch", new: true },
    { name: "ICED CAFFE MOCHA", price: "$2.60", desc: "Espresso, bittersweet mocha sauce, milk and ice" },
    { name: "ICED GINGERBREAD LATTE", price: "$3.92", desc: "Espresso, Milk, Ice, and Gingerbread Flavor" }
  ];

  return (
    <section className="menu-section"       
    style={{ 
        backgroundImage: "url('/images/menu.png')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        minHeight: '80vh'
      }}>
      <div className="menu-container" >
        <div className="menu-header">
          <h2>EXPLORE OUR MENU.</h2>
          <div className="menu-line"></div>
        </div>

        <div className="menu-grid">
          {menuItems.map((item, index) => (
            <div key={index} className="menu-item">
              <div className="menu-left">
                <h3>
                  {item.name}
                  {item.new && <span className="menu-new">New</span>}
                
                </h3>
                <p>{item.desc}</p>
              </div>
              <div className="menu-right">
                <span className="menu-price">{item.price}</span>
                
              </div>
            </div>
          ))}
        </div>

        <ul className='menu-link'>
          <li><a href="/menu">See More</a></li>
        </ul>
      </div>
    </section>
  );
};

export default Menu;
