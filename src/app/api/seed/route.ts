import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    // Check if data already exists
    const userCount = await db.user.count();
    if (userCount > 0) {
      return NextResponse.json({ message: 'Database already seeded', seeded: false });
    }

    // --- Users ---
    const adminPassword = await hashPassword('admin123');
    const ownerPassword = await hashPassword('owner123');
    const visitorPassword = await hashPassword('visitor123');

    const admin = await db.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@citydir.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    const owner = await db.user.create({
      data: {
        name: 'Restaurant Owner',
        email: 'owner@restaurant.com',
        password: ownerPassword,
        phone: '+91-9876543210',
        role: 'BUSINESS_OWNER',
      },
    });

    const owner2 = await db.user.create({
      data: {
        name: 'Healthcare Manager',
        email: 'manager@hospital.com',
        password: ownerPassword,
        phone: '+91-9876543211',
        role: 'BUSINESS_OWNER',
      },
    });

    const visitor = await db.user.create({
      data: {
        name: 'Test Visitor',
        email: 'visitor@test.com',
        password: visitorPassword,
        phone: '+91-9988776655',
        role: 'VISITOR',
      },
    });

    // --- Categories ---
    const categories = await Promise.all([
      db.category.create({ data: { name: 'Restaurants', slug: 'restaurants', icon: 'UtensilsCrossed', description: 'Dining and food establishments', order: 1 } }),
      db.category.create({ data: { name: 'Hotels', slug: 'hotels', icon: 'BedDouble', description: 'Accommodation and lodging', order: 2 } }),
      db.category.create({ data: { name: 'Hospitals', slug: 'hospitals', icon: 'Heart', description: 'Healthcare facilities', order: 3 } }),
      db.category.create({ data: { name: 'Schools', slug: 'schools', icon: 'GraduationCap', description: 'Educational institutions', order: 4 } }),
      db.category.create({ data: { name: 'Shopping', slug: 'shopping', icon: 'ShoppingBag', description: 'Retail and shopping centers', order: 5 } }),
      db.category.create({ data: { name: 'Banks', slug: 'banks', icon: 'Landmark', description: 'Banking and financial services', order: 6 } }),
      db.category.create({ data: { name: 'Transport', slug: 'transport', icon: 'Train', description: 'Public transport and travel', order: 7 } }),
      db.category.create({ data: { name: 'Sports & Recreation', slug: 'sports-recreation', icon: 'Trophy', description: 'Sports facilities and recreation', order: 8 } }),
    ]);

    // --- Localities ---
    const localities = await Promise.all([
      db.locality.create({ data: { name: 'Downtown', slug: 'downtown', description: 'City center business district', order: 1 } }),
      db.locality.create({ data: { name: 'Northside', slug: 'northside', description: 'Northern residential area', order: 2 } }),
      db.locality.create({ data: { name: 'Southside', slug: 'southside', description: 'Southern commercial zone', order: 3 } }),
      db.locality.create({ data: { name: 'East End', slug: 'east-end', description: 'Eastern industrial area', order: 4 } }),
      db.locality.create({ data: { name: 'West End', slug: 'west-end', description: 'Western cultural hub', order: 5 } }),
      db.locality.create({ data: { name: 'Central', slug: 'central', description: 'Central city area', order: 6 } }),
    ]);

    // Helper to reference categories/localities by index
    const cat = (i: number) => categories[i].id;
    const loc = (i: number) => localities[i].id;

    // --- Businesses ---
    const businesses = await Promise.all([
      // 1. City Railway Station (AMENITY)
      db.business.create({
        data: {
          name: 'City Railway Station',
          slug: 'city-railway-station',
          description: 'Main railway station connecting the city to major destinations. Modern facilities with waiting lounges, food courts, and ticket booking counters.',
          type: 'AMENITY',
          address: 'Station Road, Downtown',
          phone: '+91-1800-123-4567',
          lat: 28.6139,
          lng: 77.2090,
          isVerified: true,
          isFeatured: true,
          categoryId: cat(6), // Transport
          localityId: loc(0), // Downtown
          ownerId: admin.id,
        },
      }),
      // 2. Municipal Airport (AMENITY)
      db.business.create({
        data: {
          name: 'Municipal Airport',
          slug: 'municipal-airport',
          description: 'City airport serving domestic and international flights with modern terminals.',
          type: 'AMENITY',
          address: 'Airport Road, East End',
          phone: '+91-1800-234-5678',
          lat: 28.5562,
          lng: 77.1000,
          isVerified: true,
          isFeatured: true,
          categoryId: cat(6), // Transport
          localityId: loc(3), // East End
          ownerId: admin.id,
        },
      }),
      // 3. The Grand Hotel
      db.business.create({
        data: {
          name: 'The Grand Hotel',
          slug: 'the-grand-hotel',
          description: 'Luxury 5-star hotel with world-class amenities, fine dining, spa, and conference facilities.',
          type: 'BUSINESS',
          address: '42 Royal Plaza, Downtown',
          phone: '+91-11-2345-6789',
          email: 'info@grandhotel.com',
          website: 'https://grandhotel.com',
          lat: 28.6200,
          lng: 77.2150,
          rating: 4.8,
          isVerified: true,
          isFeatured: true,
          categoryId: cat(1), // Hotels
          localityId: loc(0), // Downtown
          ownerId: owner.id,
        },
      }),
      // 4. City General Hospital
      db.business.create({
        data: {
          name: 'City General Hospital',
          slug: 'city-general-hospital',
          description: 'Multi-specialty hospital providing comprehensive healthcare services with 24/7 emergency care.',
          type: 'BUSINESS',
          address: '15 Health Avenue, Northside',
          phone: '+91-11-3456-7890',
          email: 'info@cityhospital.com',
          website: 'https://cityhospital.com',
          lat: 28.6500,
          lng: 77.2200,
          rating: 4.5,
          isVerified: true,
          isFeatured: true,
          categoryId: cat(2), // Hospitals
          localityId: loc(1), // Northside
          ownerId: owner2.id,
        },
      }),
      // 5. Sunrise Restaurant
      db.business.create({
        data: {
          name: 'Sunrise Restaurant',
          slug: 'sunrise-restaurant',
          description: 'Popular family restaurant serving authentic Indian and Continental cuisine in a cozy ambiance.',
          type: 'BUSINESS',
          address: '8 Food Street, Southside',
          phone: '+91-11-4567-8901',
          email: 'hello@sunriserestaurant.com',
          lat: 28.5800,
          lng: 77.2300,
          rating: 4.3,
          isVerified: true,
          isFeatured: false,
          categoryId: cat(0), // Restaurants
          localityId: loc(2), // Southside
          ownerId: owner.id,
        },
      }),
      // 6. TechHub Shopping Mall
      db.business.create({
        data: {
          name: 'TechHub Shopping Mall',
          slug: 'techhub-shopping-mall',
          description: 'Premier shopping destination with 200+ stores, food court, multiplex, and entertainment zone.',
          type: 'BUSINESS',
          address: '100 Mall Road, Central',
          phone: '+91-11-5678-9012',
          email: 'info@techhubmall.com',
          website: 'https://techhubmall.com',
          lat: 28.6100,
          lng: 77.2000,
          rating: 4.6,
          isVerified: true,
          isFeatured: true,
          categoryId: cat(4), // Shopping
          localityId: loc(5), // Central
          ownerId: owner.id,
        },
      }),
      // 7. State Bank Central
      db.business.create({
        data: {
          name: 'State Bank Central',
          slug: 'state-bank-central',
          description: 'Main branch of State Bank offering all banking, loan, and investment services.',
          type: 'BUSINESS',
          address: '5 Bankers Lane, Downtown',
          phone: '+91-11-6789-0123',
          email: 'central@statebank.com',
          website: 'https://statebank.com',
          lat: 28.6150,
          lng: 77.2050,
          rating: 4.0,
          isVerified: true,
          isFeatured: false,
          categoryId: cat(5), // Banks
          localityId: loc(0), // Downtown
          ownerId: admin.id,
        },
      }),
      // 8. City International School
      db.business.create({
        data: {
          name: 'City International School',
          slug: 'city-international-school',
          description: 'CBSE-affiliated school providing quality education from nursery to class XII with modern facilities.',
          type: 'BUSINESS',
          address: '25 Education Lane, West End',
          phone: '+91-11-7890-1234',
          email: 'admissions@cityschool.edu',
          website: 'https://cityschool.edu',
          lat: 28.6250,
          lng: 77.1900,
          rating: 4.7,
          isVerified: true,
          isFeatured: true,
          categoryId: cat(3), // Schools
          localityId: loc(4), // West End
          ownerId: owner2.id,
        },
      }),
      // 9. Green Valley Sports Club
      db.business.create({
        data: {
          name: 'Green Valley Sports Club',
          slug: 'green-valley-sports-club',
          description: 'Premium sports club with swimming pool, tennis courts, gym, and cricket grounds.',
          type: 'BUSINESS',
          address: '50 Sports Complex, Northside',
          phone: '+91-11-8901-2345',
          email: 'membership@greensports.com',
          lat: 28.6550,
          lng: 77.2250,
          rating: 4.4,
          isVerified: true,
          isFeatured: false,
          categoryId: cat(7), // Sports & Recreation
          localityId: loc(1), // Northside
          ownerId: owner.id,
        },
      }),
      // 10. Metro Supermarket
      db.business.create({
        data: {
          name: 'Metro Supermarket',
          slug: 'metro-supermarket',
          description: 'Large supermarket chain offering groceries, fresh produce, household items, and electronics at competitive prices.',
          type: 'BUSINESS',
          address: '30 Market Street, Central',
          phone: '+91-11-9012-3456',
          email: 'info@metrosupermarket.com',
          lat: 28.6080,
          lng: 77.1980,
          rating: 4.2,
          isVerified: true,
          isFeatured: false,
          categoryId: cat(4), // Shopping
          localityId: loc(5), // Central
          ownerId: owner.id,
        },
      }),
      // 11. Dr. Sharma Clinic
      db.business.create({
        data: {
          name: 'Dr. Sharma Clinic',
          slug: 'dr-sharma-clinic',
          description: 'Multi-specialty clinic offering consultations in general medicine, dermatology, and pediatrics.',
          type: 'BUSINESS',
          address: '12 Health Avenue, Northside',
          phone: '+91-11-0123-4567',
          email: 'appointments@drsharma.com',
          lat: 28.6520,
          lng: 77.2210,
          rating: 4.6,
          isVerified: true,
          isFeatured: false,
          categoryId: cat(2), // Hospitals
          localityId: loc(1), // Northside
          ownerId: owner2.id,
        },
      }),
      // 12. QuickFix Electronics
      db.business.create({
        data: {
          name: 'QuickFix Electronics',
          slug: 'quickfix-electronics',
          description: 'One-stop electronics shop for gadgets, repairs, and accessories. Authorized dealer for major brands.',
          type: 'BUSINESS',
          address: '18 Tech Plaza, East End',
          phone: '+91-11-1234-5678',
          email: 'sales@quickfixelectronics.com',
          lat: 28.5600,
          lng: 77.1100,
          rating: 4.1,
          isVerified: false,
          isFeatured: false,
          categoryId: cat(4), // Shopping
          localityId: loc(3), // East End
          ownerId: owner.id,
        },
      }),
      // 13. City Swimming Pool (AMENITY)
      db.business.create({
        data: {
          name: 'City Swimming Pool',
          slug: 'city-swimming-pool',
          description: 'Public swimming pool with Olympic-size lanes, coaching classes, and family swim sessions.',
          type: 'AMENITY',
          address: '75 Recreation Road, Southside',
          phone: '+91-11-2345-6780',
          lat: 28.5850,
          lng: 77.2350,
          isVerified: true,
          isFeatured: false,
          categoryId: cat(7), // Sports & Recreation
          localityId: loc(2), // Southside
          ownerId: admin.id,
        },
      }),
      // 14. Central Park & Ground (AMENITY)
      db.business.create({
        data: {
          name: 'Central Park & Ground',
          slug: 'central-park-ground',
          description: 'Largest public park in the city with jogging tracks, playgrounds, botanical garden, and amphitheater.',
          type: 'AMENITY',
          address: 'Central Park Road, Central',
          phone: '+91-11-3456-7891',
          lat: 28.6120,
          lng: 77.2020,
          isVerified: true,
          isFeatured: true,
          categoryId: cat(7), // Sports & Recreation
          localityId: loc(5), // Central
          ownerId: admin.id,
        },
      }),
    ]);

    // Helper to reference businesses by index
    const biz = (i: number) => businesses[i].id;

    // --- Products / Services ---
    const productData: { name: string; description: string; price: string; type: string; businessIdx: number }[] = [
      // Sunrise Restaurant
      { name: 'Butter Chicken', description: 'Creamy tomato-based chicken curry', price: '₹350', type: 'PRODUCT', businessIdx: 4 },
      { name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: '₹280', type: 'PRODUCT', businessIdx: 4 },
      { name: 'Biryani Special', description: 'Fragrant basmati rice with aromatic spices', price: '₹320', type: 'PRODUCT', businessIdx: 4 },
      { name: 'Catering Service', description: 'Full catering for events and parties', price: '₹500/person', type: 'SERVICE', businessIdx: 4 },
      // The Grand Hotel
      { name: 'Deluxe Room', description: 'Spacious room with city view', price: '₹8,000/night', type: 'PRODUCT', businessIdx: 2 },
      { name: 'Suite Room', description: 'Premium suite with lounge area', price: '₹15,000/night', type: 'PRODUCT', businessIdx: 2 },
      { name: 'Spa Treatment', description: 'Full body relaxation massage', price: '₹3,000', type: 'SERVICE', businessIdx: 2 },
      { name: 'Conference Hall', description: 'Meeting room for up to 200 people', price: '₹25,000/day', type: 'SERVICE', businessIdx: 2 },
      // City General Hospital
      { name: 'General Consultation', description: 'Doctor consultation for general health', price: '₹500', type: 'SERVICE', businessIdx: 3 },
      { name: 'Health Checkup Package', description: 'Complete body health screening', price: '₹3,500', type: 'SERVICE', businessIdx: 3 },
      { name: 'Dental Care', description: 'Comprehensive dental checkup and treatment', price: '₹1,200', type: 'SERVICE', businessIdx: 3 },
      { name: 'Lab Tests', description: 'Blood tests and diagnostic services', price: '₹800', type: 'SERVICE', businessIdx: 3 },
      // TechHub Shopping Mall
      { name: 'Parking Pass', description: 'Full day parking at the mall', price: '₹100', type: 'SERVICE', businessIdx: 5 },
      { name: 'Gift Card', description: 'Prepaid gift card for any store', price: '₹1,000', type: 'PRODUCT', businessIdx: 5 },
      // State Bank Central
      { name: 'Savings Account', description: 'Zero balance savings account', price: 'No fee', type: 'SERVICE', businessIdx: 6 },
      { name: 'Home Loan', description: 'Home loan at competitive interest rates', price: '8.5% p.a.', type: 'SERVICE', businessIdx: 6 },
      { name: 'Fixed Deposit', description: 'Fixed deposit with guaranteed returns', price: '7% p.a.', type: 'SERVICE', businessIdx: 6 },
      // City International School
      { name: 'Admission Form', description: 'Admission form for academic year', price: '₹500', type: 'PRODUCT', businessIdx: 7 },
      { name: 'Transport Service', description: 'School bus facility', price: '₹3,000/month', type: 'SERVICE', businessIdx: 7 },
      { name: 'Summer Camp', description: 'Sports and arts summer camp', price: '₹5,000', type: 'SERVICE', businessIdx: 7 },
      // Green Valley Sports Club
      { name: 'Annual Membership', description: 'Full access to all sports facilities', price: '₹15,000/year', type: 'SERVICE', businessIdx: 8 },
      { name: 'Personal Training', description: 'One-on-one fitness training session', price: '₹1,500/session', type: 'SERVICE', businessIdx: 8 },
      { name: 'Swimming Classes', description: 'Learn swimming from certified coaches', price: '₹2,000/month', type: 'SERVICE', businessIdx: 8 },
      // Metro Supermarket
      { name: 'Home Delivery', description: 'Doorstep delivery of groceries', price: '₹49', type: 'SERVICE', businessIdx: 9 },
      { name: 'Organic Produce Box', description: 'Weekly box of fresh organic vegetables', price: '₹699', type: 'PRODUCT', businessIdx: 9 },
      // Dr. Sharma Clinic
      { name: 'Online Consultation', description: 'Video consultation with Dr. Sharma', price: '₹400', type: 'SERVICE', businessIdx: 10 },
      { name: 'Skin Treatment', description: 'Dermatology consultation and treatment', price: '₹1,500', type: 'SERVICE', businessIdx: 10 },
      // QuickFix Electronics
      { name: 'Phone Repair', description: 'Screen replacement and repairs', price: '₹2,000', type: 'SERVICE', businessIdx: 11 },
      { name: 'Laptop Repair', description: 'Hardware and software troubleshooting', price: '₹1,500', type: 'SERVICE', businessIdx: 11 },
      { name: 'Wireless Earbuds', description: 'Bluetooth 5.0 wireless earbuds', price: '₹1,299', type: 'PRODUCT', businessIdx: 11 },
      // City Swimming Pool
      { name: 'Day Pass', description: 'Single day swimming pool access', price: '₹100', type: 'SERVICE', businessIdx: 12 },
      { name: 'Monthly Pass', description: 'Unlimited swimming for a month', price: '₹1,500', type: 'SERVICE', businessIdx: 12 },
      // Central Park
      { name: 'Jogging Track Pass', description: 'Access to the jogging tracks', price: 'Free', type: 'SERVICE', businessIdx: 13 },
      { name: 'Event Venue Booking', description: 'Book the amphitheater for events', price: '₹10,000/day', type: 'SERVICE', businessIdx: 13 },
    ];

    await Promise.all(
      productData.map(p =>
        db.product.create({
          data: {
            name: p.name,
            description: p.description,
            price: p.price,
            type: p.type,
            businessId: biz(p.businessIdx),
          },
        })
      )
    );

    // --- Enquiries ---
    const enquiry1 = await db.enquiry.create({
      data: {
        businessId: biz(4), // Sunrise Restaurant
        visitorId: visitor.id,
        name: visitor.name,
        email: visitor.email,
        message: 'Do you have vegetarian options for a party of 20? We are planning a birthday celebration.',
        status: 'IN_PROGRESS',
      },
    });

    const enquiry2 = await db.enquiry.create({
      data: {
        businessId: biz(3), // City General Hospital
        visitorId: visitor.id,
        name: visitor.name,
        email: visitor.email,
        phone: '+91-9988776655',
        message: 'I would like to book a health checkup package for this weekend. Are appointments available?',
        status: 'OPEN',
      },
    });

    const enquiry3 = await db.enquiry.create({
      data: {
        businessId: biz(2), // The Grand Hotel
        visitorId: visitor.id,
        name: visitor.name,
        email: visitor.email,
        message: 'What are the rates for a conference hall booking for 2 days next month?',
        status: 'CLOSED',
      },
    });

    // --- Messages ---
    await db.message.createMany({
      data: [
        { content: 'Do you have vegetarian options for a party of 20? We are planning a birthday celebration.', enquiryId: enquiry1.id, senderId: visitor.id },
        { content: 'Hello! Yes, we have an extensive vegetarian menu. We can also create a custom party menu. Would you like me to send you our party packages?', enquiryId: enquiry1.id, senderId: owner.id },
        { content: 'That sounds great! Please share the packages.', enquiryId: enquiry1.id, senderId: visitor.id },
        { content: 'Sure! Our Silver Package is ₹350/person with 3 starters, 2 mains, and dessert. Gold Package at ₹500/person adds live counters. Platinum at ₹800/person includes everything plus a dedicated server and decoration.', enquiryId: enquiry1.id, senderId: owner.id },
        { content: 'The Gold Package looks perfect for us. Can we schedule it for next Saturday?', enquiryId: enquiry1.id, senderId: visitor.id },
        { content: 'Next Saturday works! Let me check the availability and get back to you with a confirmation by tomorrow morning.', enquiryId: enquiry1.id, senderId: owner.id },
        { content: 'I would like to book a health checkup package for this weekend. Are appointments available?', enquiryId: enquiry2.id, senderId: visitor.id },
        { content: 'Thank you for reaching out! We have availability on both Saturday and Sunday this weekend. Would you prefer a morning or afternoon slot?', enquiryId: enquiry2.id, senderId: owner2.id },
        { content: 'Saturday morning would be ideal. Should I fast before the checkup?', enquiryId: enquiry2.id, senderId: visitor.id },
        { content: 'Yes, 12 hours of fasting is recommended. Please arrive at 8:30 AM, the checkup takes about 3-4 hours. Bring your ID and any previous medical reports.', enquiryId: enquiry2.id, senderId: owner2.id },
        { content: 'What are the rates for a conference hall booking for 2 days next month?', enquiryId: enquiry3.id, senderId: visitor.id },
        { content: 'Our conference hall rates are ₹25,000 per day. For a 2-day booking, we offer a 10% discount at ₹45,000. The hall accommodates up to 200 guests with projector and sound system included.', enquiryId: enquiry3.id, senderId: owner.id },
        { content: 'That works for us. Thank you!', enquiryId: enquiry3.id, senderId: visitor.id },
      ],
    });

    // --- Reviews ---
    // Map review businesses by index into the businesses array:
    // businesses[2] = The Grand Hotel, businesses[3] = City General Hospital,
    // businesses[4] = Sunrise Restaurant, businesses[5] = TechHub Shopping Mall,
    // businesses[7] = City International School, businesses[1] = Municipal Airport
    const reviewData = [
      { userId: visitor.id, businessId: businesses[2].id, rating: 5, comment: 'Absolutely stunning hotel! The rooms were spacious and the service was top-notch. Highly recommend for business events.' },
      { userId: visitor.id, businessId: businesses[3].id, rating: 4, comment: 'Good facilities and caring staff. The wait time was a bit long but overall a positive experience.' },
      { userId: visitor.id, businessId: businesses[4].id, rating: 5, comment: 'Best biryani in town! The vegetarian thali is also excellent. Great ambiance for family dinners.' },
      { userId: visitor.id, businessId: businesses[5].id, rating: 4, comment: 'Huge mall with all major brands. The food court has amazing variety. Parking could be better.' },
      { userId: visitor.id, businessId: businesses[7].id, rating: 5, comment: 'Excellent school with dedicated teachers. The extracurricular activities are fantastic for overall development.' },
      { userId: visitor.id, businessId: businesses[1].id, rating: 3, comment: 'Decent airport for a smaller city. Clean facilities but limited food options.' },
    ];

    for (const rd of reviewData) {
      if (rd.businessId) {
        await db.review.create({ data: rd });
      }
    }

    // Update business ratings based on reviews
    for (const biz of businesses) {
      const stats = await db.review.aggregate({ where: { businessId: biz.id }, _avg: { rating: true } });
      if (stats._avg.rating) {
        await db.business.update({ where: { id: biz.id }, data: { rating: Math.round(stats._avg.rating * 10) / 10 } });
      }
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      seeded: true,
      stats: {
        users: 4,
        categories: 8,
        localities: 6,
        businesses: 14,
        products: productData.length,
        enquiries: 3,
        messages: 13,
        reviews: reviewData.length,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}