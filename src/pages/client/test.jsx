
    <div className="container mb-5 mt-5">
      <h3 className="mb-4">Flight Availability</h3>
      {searchParams && (
        <div className="mb-4 p-3 bg-light rounded-3">
          <h5>Search Details</h5>
          <p>
            <strong>Trip Type:</strong> {searchParams.tripType === 'oneway' ? 'One Way' : 'Round Trip'}
          </p>
          <p>
            <strong>Class:</strong> {searchParams.flightType.replace('_', ' ').toUpperCase()}
          </p>
          <p>
            <strong>Travellers:</strong>{' '}
            {`${searchParams.adults} Adult${searchParams.adults > 1 ? 's' : ''}${
              searchParams.children > 0 ? `, ${searchParams.children} Child${searchParams.children > 1 ? 'ren' : ''}` : ''
            }${searchParams.infants > 0 ? `, ${searchParams.infants} Infant${searchParams.infants > 1 ? 's' : ''}` : ''}`}
          </p>
          {searchParams.flights.map((flight, index) => (
            <p key={index}>
              <strong>Flight {index + 1}:</strong> {getAirportName(flight.origin)} to{' '}
              {getAirportName(flight.destination)} on {formatDate(flight.depart)}
            </p>
          ))}
          {searchParams.tripType === 'return' && (
            <p>
              <strong>Return:</strong> {getAirportName(searchParams.flights[0].destination)} to{' '}
              {getAirportName(searchParams.flights[0].origin)} on {formatDate(searchParams.returnDate)}
            </p>
          )}
        </div>
      )}

      {availableFlights.length > 0 ? (
        <>
          <h4 className="mb-3">Outbound Flights</h4>
          <div className="row g-4">
            {availableFlights.map((flight) => (
              <div key={flight.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <img
                        src={airlines.find((a) => a.code === flight.airline)?.logo || 'https://example.com/placeholder.png'}
                        alt={getAirlineName(flight.airline)}
                        className="me-2"
                        style={{ width: '40px', height: '40px' }}
                      />
                      <h5 className="card-title mb-0">{getAirlineName(flight.airline)}</h5>
                    </div>
                    <p className="card-text">
                      <strong>{getAirportName(flight.origin)}</strong> to{' '}
                      <strong>{getAirportName(flight.destination)}</strong>
                    </p>
                    <p className="card-text">
                      <small className="text-muted">
                        {formatTime(flight.departureTime)} - {formatTime(flight.arrivalTime)} • {flight.duration}
                      </small>
                    </p>
                    <p className="card-text">
                      <strong>${flight.price[searchParams.flightType]}</strong> ({searchParams.flightType.replace('_', ' ')})
                    </p>
                    <p className="card-text">
                      <small>Flight {flight.flightNumber}</small>
                    </p>
                    <a href={`/flight/book/${flight.id}`} className="btn btn-primary w-100">
                      Book Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-muted">No outbound flights found for your search.</p>
      )}

      {searchParams?.tripType === 'return' && returnFlights.length > 0 && (
        <>
          <h4 className="mt-5 mb-3">Return Flights</h4>
          <div className="row g-4">
            {returnFlights.map((flight) => (
              <div key={flight.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <img
                        src={airlines.find((a) => a.code === flight.airline)?.logo || 'https://example.com/placeholder.png'}
                        alt={getAirlineName(flight.airline)}
                        className="me-2"
                        style={{ width: '40px', height: '40px' }}
                      />
                      <h5 className="card-title mb-0">{getAirlineName(flight.airline)}</h5>
                    </div>
                    <p className="card-text">
                      <strong>{getAirportName(flight.origin)}</strong> to{' '}
                      <strong>{getAirportName(flight.destination)}</strong>
                    </p>
                    <p className="card-text">
                      <small className="text-muted">
                        {formatTime(flight.departureTime)} - {formatTime(flight.arrivalTime)} • {flight.duration}
                      </small>
                    </p>
                    <p className="card-text">
                      <strong>${flight.price[searchParams.flightType]}</strong> ({searchParams.flightType.replace('_', ' ')})
                    </p>
                    <p className="card-text">
                      <small>Flight {flight.flightNumber}</small>
                    </p>
                    <a href={`/flight/book/${flight.id}`} className="btn btn-primary w-100">
                      Book Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {searchParams?.tripType === 'return' && returnFlights.length === 0 && (
        <p className="text-muted mt-3">No return flights found for your search.</p>
      )}
    </div>