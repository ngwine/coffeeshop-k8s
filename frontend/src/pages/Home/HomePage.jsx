import React from 'react';
import HeroBanner from '../../components/landing/HeroBanner';
import SalePoints from '../../components/landing/SalePoints';
import WhyChooseUs from '../../components/landing/Whychooseus';
import VoucherList from '../../components/landing/VoucherList';
import ProductCarousel from '../../components/landing/ProductCarousel';
import Partners from '../../components/landing/Partners';
import Menu from '../../components/landing/Menu';
import TestimonialFooterSection from '../../components/landing/TestimonialFooterSection';
import Process from '../../components/landing/Process';
import RecentPosts from '../../components/landing/RecentPosts';
import Newsletter from '../../components/landing/Newsletter';
import CoffeeOrigin from '../../components/landing/CoffeeOrigin';
import Footer from '../../components/Footer';
import '../../styles/style.css';
import './home.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero-product-container" style={{ position: 'relative' }}>
        <HeroBanner />
         {/* <SalePoints /> */}
        {/* <Partners /> */}
        {/* <Process /> */}
        {/* <VoucherList/> */}
        <section id="product-carousel">
      <ProductCarousel />
    </section>
      </div>
     
      
      
      {/* <Menu /> */}
      {/* <TestimonialFooterSection /> */}
      <WhyChooseUs />
      <CoffeeOrigin />
      <Newsletter />
      <RecentPosts />
      <Footer />
    </div>
  );
};

export default HomePage; 