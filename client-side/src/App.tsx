// src/App.tsx (Cập nhật cuối cùng)

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/homPageComponent/HomePage'; 
import MainLayout from './components/LayoutComponent/MainLayout'; 
import ToursPage from './components/toursPageComponent/ToursPage';
import InformationComponent from './components/InformationComponent/InformationComponent';
import TourBooking from './components/TourBookingComponent/TourBooking';
import TourDetail from './components/TourDetailComponent/TourDetail';
import BookingPayment from './components/BookingPaymentComponent/BookingPayment';
import PaymentFailed from './components/BookingPaymentComponent/PaymentFailed';
import PaymentSuccess from './components/BookingPaymentComponent/PaymentSuccess';
import PaymentWaitingPage from './components/BookingPaymentComponent/PaymentWaitingPage ';
import PaymentError from './components/BookingPaymentComponent/PaymentError';
import Register from './components/RegisterComponent/Register';
import VerifyEmail from './components/VerifyEmail/VerifyEmail';
import Login from './components/Login/Login';
import AdminComponent from './components/AdminComponent/AdminComponent';
import CouponManagement from './components/AdminComponent/Pages/CounponsPage/CouponManagement';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from './utils/ScrollToTop';
// // Các trang giả định
// const HotelPage = () => <div>Trang Khách sạn</div>; 
// const FlightsPage = () => <div>Trang Vé máy bay</div>; 
// const EntertainmentPage = () => <div>Trang Vui chơi giải trí</div>;
// const TrainsPage = () => <div>Trang Vé tàu</div>;
// const LoginPage = () => <div>Trang Đăng nhập</div>; 
// const AdminPage = () => <div>Trang Quản trị</div>; 

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>

        
        {/* LAYOUT CHÍNH: Bọc tất cả các trang cần Header và Footer */}
        <Route element={<MainLayout />}>
                
             
            {/* Trang Chủ (Landing page) */}
            <Route path="/" element={<HomePage />} /> 
            
            {/* Trang Tours (Sẽ nhận params từ Banner) */}
            <Route path="/tours" element={<ToursPage />} /> 
            
            {/* Trang Information */}
            <Route path="/information" element={<InformationComponent />} />
            <Route path="/information/:tab" element={<InformationComponent />} />
            
            {/* Các trang khác
            <Route path="/hotel" element={<HotelPage />} />
            <Route path="/flights" element={<FlightsPage />} />
            <Route path="/entertainment" element={<EntertainmentPage />} />
            <Route path="/trains" element={<TrainsPage />} /> */}

            <Route 
              path="/tour-detail" 
              element={<TourDetail />} 
          />

          <Route 
              path="/tour/:tourCode" 
              element={<TourDetail />} 
          />
          <Route 
              path="/order-booking" 
              element={<TourBooking />} 
          />
          <Route 
              path="/payment-booking" 
              element={<BookingPayment />}
          />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/payment-waiting" element={<PaymentWaitingPage />} />
          <Route path="/payment-error" element={<PaymentError />} />

          <Route path="/register" element={<Register />} />
           <Route 
              path="/login" 
              element={<Login />} 
          />
        </Route>
          
        {/* CÁC TRANG KHÔNG SỬ DỤNG LAYOUT */}
        <Route path="/admin/*" element={<AdminComponent />} /> 
        

      </Routes>

        <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
        />
    </Router>
  );
}
export default App;