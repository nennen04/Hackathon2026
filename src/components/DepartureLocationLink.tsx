interface DepartureLocationLinkProps {
  departureLocation: string;
  onClick: () => void;
}

function DepartureLocationLink({ departureLocation, onClick }: DepartureLocationLinkProps) {
  return (
    <div className="departure-location-link">
      <span className="departure-location-link__prefix">出発：</span>
      <button type="button" className="departure-location-link__value" onClick={onClick}>
        {departureLocation}
      </button>
    </div>
  );
}

export default DepartureLocationLink;
