import React, { useEffect, useState } from 'react';

const FeaturedFlights = () => {
  // State for featured flights
  const [flights, setFlights] = useState([]);

  // Mock flight data
  const featuredFlights = [
    {
      id: 1,
      origin: 'New York (JFK)',
      origin_code: 'jfk',
      destination: 'London (LHR)',
      destination_code: 'lhr',
      airline_name: 'British Airways',
      price: 599,
      image: 'https://example.com/flight1.jpg',
    },
    {
      id: 2,
      origin: 'Dubai (DXB)',
      origin_code: 'dxb',
      destination: 'Paris (CDG)',
      destination_code: 'cdg',
      airline_name: 'Emirates',
      price: 749,
      image: 'https://example.com/flight2.jpg',
    },
    {
      id: 3,
      origin: 'Tokyo (NRT)',
      origin_code: 'nrt',
      destination: 'Sydney (SYD)',
      destination_code: 'syd',
      airline_name: 'Qantas',
      price: 899,
      image: 'https://example.com/flight3.jpg',
    },
    {
      id: 4,
      origin: 'Los Angeles (LAX)',
      origin_code: 'lax',
      destination: 'Miami (MIA)',
      destination_code: 'mia',
      airline_name: 'American Airlines',
      price: 299,
      image: 'https://example.com/flight4.jpg',
    },
  ];

  // Load mock data on component mount
  useEffect(() => {
    setFlights(featuredFlights);
  }, []);

  return (
    <div className="container mb-5 mt-5 p-5">
        <div className="row">
            <div className="col-lg-12">
                <div className="section-heading">
                    <div className="text-start text-left">
                        <h4 className="mt-1 mb-0"><strong>Featured Flights</strong></h4>
                        <p>These alluring destinations are picked just for you</p>
                    </div>
                    <div className="mb-4"></div>
                </div>
            </div>
        </div>
        <div className="row padding-top-0px">
            <div className="col-lg-12">
                <div className="popular-round-trip-wrap padding-top-10px">
                    <div className="tab-content" id="myTabContent4">
                        <div className="tab-pane fade show active" id="featured-flights" role="tabpanel" aria-labelledby="featured-flights-tab">
                            <div className="row g-3" id="featured-flights-container">
                                {flights.map((flight) => (
                                <div key={flight.id} className="col-xl-4 col-12">
                                    <a className="hover-primary rounded-3 d-flex p-3 px-4 fadeout" href={`/flight/${flight.id}/${flight.origin_code}-${flight.destination_code}`}>
                                        <div className="col-5 d-flex flex-column">
                                            <p className="m-0 text-hover"><strong>{flight.origin}</strong></p>
                                            <p className="m-0 text-muted fw-lighter text-truncate"><small>{flight.airline_name}</small></p>
                                        </div>
                                        <div className="col-2 d-flex flex-column justify-content-center align-items-center">
                                            <div  className="vr mx-auto my-auto"></div>
                                            <svg className="plane-svg rounded-5 my-1" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 -7 12 24">
                                                <path d="m.991 6.037-.824.825 2.887 1.237 1.237 2.888.825-.825-.412-2.063 1.932-1.932 2.106 4.494.781-.781-.694-5.906 1.65-1.65a1.167 1.167 0 1 0-1.65-1.65L7.136 2.369 1.23 1.673l-.738.739 4.459 2.14L3.054 6.45.991 6.037Z"></path>
                                            </svg>
                                            <div className="vr mx-auto my-auto"></div>
                                        </div>
                                        <div className="col-5 d-flex flex-column align-items-end">
                                            <p className="m-0 text-hover"><strong>{flight.destination}</strong></p>
                                            <p className="m-0 text-muted fw-lighter"><small>${flight.price}</small></p>
                                        </div>
                                    </a>
                                </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    
        // <div className="featured-sections p-5">
        //     {{ /* Placeholder for featured hotels, flights, tours, cars, and blog */}}
             
        //     {{ /* Flights */}}
        //     <div className="py-5 p-5">
        //         <div className="container">
        //             <section className="round-trip-flight mb-4">
        //                 <div className="row">
        //                     <div className="col-lg-12">
        //                         <div className="section-heading">
        //                             <div className="text-start text-left">
        //                                 <h4 className="mt-1 mb-0"><strong>Featured Flights</strong></h4>
        //                                 <p>These alluring destinations are picked just for you</p>
        //                             </div>
        //                             <div className="mb-4"></div>
        //                         </div>
        //                     </div>
        //                 </div>
        //                 <div className="row padding-top-0px">
        //                     <div className="col-lg-12">
        //                         <div className="popular-round-trip-wrap padding-top-10px">
        //                             <div className="tab-content" id="myTabContent4">
        //                                 <div className="tab-pane fade show active" id="featured-flights" role="tabpanel" aria-labelledby="featured-flights-tab">
        //                                     <div className="row g-3" id="featured-flights-container">
        //                                         {/* Flights Card */}
        //                                         {flights.map((flight) => (
        //                                         <div className="col-xl-4 col-12">
        //                                             <a className="hover-primary rounded-3 d-flex p-3 px-4 fadeout" href={`/flight/${flight.id}/${flight.origin_code}-${flight.destination_code}`}>
        //                                                 <div className="col-5 d-flex flex-column">
        //                                                     <p className="m-0 text-hover"><strong>${flight.origin}</strong></p>
        //                                                     <p className="m-0 text-muted fw-lighter text-truncate"><small>${flight.airline_name}</small></p>
        //                                                 </div>
        //                                                 <div className="col-2 d-flex flex-column justify-content-center align-items-center">
        //                                                     <div  className="vr mx-auto my-auto"></div>
        //                                                     <svg className="plane-svg rounded-5 my-1" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 -7 12 24">
        //                                                         <path d="m.991 6.037-.824.825 2.887 1.237 1.237 2.888.825-.825-.412-2.063 1.932-1.932 2.106 4.494.781-.781-.694-5.906 1.65-1.65a1.167 1.167 0 1 0-1.65-1.65L7.136 2.369 1.23 1.673l-.738.739 4.459 2.14L3.054 6.45.991 6.037Z"></path>
        //                                                     </svg>
        //                                                     <div className="vr mx-auto my-auto"></div>
        //                                                 </div>
        //                                                 <div className="col-5 d-flex flex-column align-items-end">
        //                                                     <p className="m-0 text-hover"><strong>${flight.destination}</strong></p>
        //                                                     <p className="m-0 text-muted fw-lighter"><small>AED ${flight.price}</small></p>
        //                                                 </div>
        //                                             </a>
        //                                         </div>
        //                                         ))}
        //                                     </div>
        //                                 </div>
        //                             </div>
        //                             <div className="tab-content-info d-flex justify-content-between align-items-center">
        //                             </div>
        //                         </div>
        //                     </div>
        //                 </div>
        //             </section>
        //         </div>
        //     </div>
        //     {{ /* Flights */}}
        // </div>
  );
};

export default FeaturedFlights;