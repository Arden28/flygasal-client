import React from "react";
// import appsImage from '../../assets/img/apps.png'; // adjust the path as needed

const androidStoreLink = 'https://play.google.com/store/apps/details?id=your.app.id'; // Replace with actual
const iosStoreLink = 'https://apps.apple.com/app/your-app-id'; // Replace with actual

const AppPromoSection = () => {
  return (
    <div className="pt-3 mobile_apps d-block text-white" style={{ background: 'var(--theme-bg)' }}>
      <div className="container mt-3">
        <div className="row">
          <div className="col-md-4 order-1">
            <img src="/assets/img/apps.png" alt="apps" className="w-100" />
          </div>

          <div className="col-md-2 d-flex align-items-center p-3 order-0">
            <div className="w-100">
              <a
                href={androidStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-100 btn-lg text-uppercase py-3 d-flex justify-content-center align-items-center gap-1 text-white mb-2 border-white"
              >
                <svg
                  className="w-6 h-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.6 5.2A1 1 0 0 0 7 6v12a1 1 0 0 0 1.6.8l8-6a1 1 0 0 0 0-1.6l-8-6Z"
                    clipRule="evenodd"
                  />
                </svg>
                Playstore
              </a>

              <a
                href={iosStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="border-white btn btn-primary w-100 btn-lg text-uppercase py-3 d-flex justify-content-center align-items-center gap-1 text-white"
              >
                <svg
                  className="w-6 h-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.537 12.625a4.421 4.421 0 0 0 2.684 4.047 10.96 10.96 0 0 1-1.384 2.845c-.834 1.218-1.7 2.432-3.062 2.457-1.34.025-1.77-.794-3.3-.794-1.531 0-2.01.769-3.275.82-1.316.049-2.317-1.318-3.158-2.532-1.72-2.484-3.032-7.017-1.27-10.077A4.9 4.9 0 0 1 8.91 6.884c1.292-.025 2.51.869 3.3.869.789 0 2.27-1.075 3.828-.917a4.67 4.67 0 0 1 3.66 1.984 4.524 4.524 0 0 0-2.16 3.805m-2.52-7.432A4.4 4.4 0 0 0 16.06 2a4.482 4.482 0 0 0-2.945 1.516 4.185 4.185 0 0 0-1.061 3.093 3.708 3.708 0 0 0 2.967-1.416Z" />
                </svg>
                App Store
              </a>
            </div>
          </div>

          <div className="col-md-6 d-flex align-items-center p-3">
            <div>
              <h4 className="mb-3 mt-3">
                <strong>Get The App!</strong>
              </h4>
              <p>
                Our app has all your travel needs covered: Secure payment channels, easy 4-step booking process. What more could you ask for?
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPromoSection;
