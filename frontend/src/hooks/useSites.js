import { useEffect, useState } from 'react';
import { fetchSites } from '../services/dashboardApi.js';

export function useSites() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSites()
      .then((data) => {
        setSites(data);
        if (data.length > 0) setSelectedSiteId(data[0].siteId);
      })
      .finally(() => setLoading(false));
  }, []);

  return { sites, selectedSiteId, setSelectedSiteId, loading };
}
