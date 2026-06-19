import PropTypes from 'prop-types';
import { useReturnLoanMutation } from "../../hooks/useLoans";

export default function MarcarDevuelto({ _id, finalizado }) {
    const { mutate: returnLoan, isPending } = useReturnLoanMutation();

    const handleClick = (e) => {
        e.preventDefault();
        returnLoan(_id);
    };

    return (
        <button
            onClick={handleClick}
            disabled={finalizado || isPending}
            className={`btn btn-sm ${finalizado ? 'btn-disabled' : 'btn-success'}`}
        >
            {isPending ? "Procesando..." : "Marcar Devuelto"}
        </button>
    );
}

MarcarDevuelto.propTypes = {
    _id: PropTypes.string.isRequired,
    finalizado: PropTypes.bool.isRequired,
};