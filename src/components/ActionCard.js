import { __ } from '@wordpress/i18n';

/**
 * Action Card Component
 *
 * @param {Object}   root0          Props object.
 * @param {string}   root0.type     Type of card.
 * @param {Object}   root0.data     Data for the card.
 * @param {Function} root0.onAction Action callback.
 */
export const ActionCard = ( { type, data, onAction } ) => {
	const titles = {
		drafts: __( 'Continue Writing', 'hey-wapuu' ),
		updates: __( 'Updates Available', 'hey-wapuu' ),
		media: __( 'Media Library Update', 'hey-wapuu' ),
		post: __( 'Next Steps', 'hey-wapuu' ),
	};

	return (
		<div className="hw-action-card">
			<div className="hw-card-header">
				<span>
					{ titles[ type ] || __( 'Suggestion', 'hey-wapuu' ) }
				</span>
			</div>
			<div className="hw-card-body">{ data.message }</div>
			<div className="hw-card-footer">
				{ data.secondaryAction && (
					<button
						className="hw-card-btn is-secondary"
						onClick={ () => onAction( data.secondaryAction.id ) }
					>
						{ data.secondaryAction.label }
					</button>
				) }
				<button
					className="hw-card-btn"
					onClick={ () => onAction( data.primaryAction.id ) }
				>
					{ data.primaryAction.label }
				</button>
			</div>
		</div>
	);
};
