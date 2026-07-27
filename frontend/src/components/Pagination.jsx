import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      marginTop: '16px',
      borderTop: '1px solid #E5E7EB'
    }}>
      {/* Info */}
      <span style={{ color: '#6B7280', fontSize: '14px' }}>
        Showing {startItem}-{endItem} of {totalItems} results
      </span>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            background: currentPage === 1 ? '#F3F4F6' : 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            color: currentPage === 1 ? '#9CA3AF' : '#374151',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          ← Prev
        </button>

        {/* Page Numbers */}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              padding: '8px 12px',
              background: currentPage === page
                ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                : 'white',
              border: `1px solid ${currentPage === page ? '#2563eb' : '#E5E7EB'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              color: currentPage === page ? 'white' : '#374151',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              minWidth: '36px'
            }}
          >
            {page}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            background: currentPage === totalPages ? '#F3F4F6' : 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            color: currentPage === totalPages ? '#9CA3AF' : '#374151',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;