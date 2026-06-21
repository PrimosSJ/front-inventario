import { useState } from "react";
import PropTypes from "prop-types";

// Hooks & Services
import { useInventoryData, useExtensionComments } from "../hooks/useInventory";
import { useExcelImport } from "../hooks/useExcelImport";
import { exportarExcel } from "../services/excel.service";

// Components & Icons
import SelectCategoria from "../components/inventario/SelectCategoria";
import EditarItem from "../components/inventario/EditarItem";
import AgregarItem from "../components/inventario/AgregarItem";
import DataPageLayout from "../components/layout/DataPageLayout";
import SearchBar from "../components/ui/SearchBar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { EmptyRow } from "../components/ui/Table/utils";
import AgregarPrestamo from "../components/prestamos/AgregarPrestamo";
import { DownloadIcon, UploadIcon, AddIcon, ChevronDownIcon, GiveFileIcon, EditSquareIcon, BoxSeamIcon, MoreVertIcon } from "../components/icons";
import Tooltip from "../components/ui/Tooltip";
import Button from "../components/ui/Button";
import QueryStateManager from "../components/ui/QueryStateManager";
import { SkeletonTable } from "../components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "tailwind-variants";
import { Menu, MenuTrigger, MenuContent, MenuItem } from "../components/ui/Menu";

// ==========================================
// PRESENTATIONAL SUB-COMPONENTS
// ==========================================

const ImportPreviewModal = ({ importPreview, importando, onCancel, onConfirm }) => {
    if (!importPreview) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg mb-2">
                    Vista previa — {importPreview.length} items a importar
                </h3>
                <div className="overflow-x-auto max-h-64">
                    <table className="table table-sm w-full">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Categoría</th>
                                <th>Tipo</th>
                                <th>Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {importPreview.map((item, i) => (
                                <tr key={i}>
                                    <td>{item.nombre || <span className="text-error">vacío</span>}</td>
                                    <td>{item.categoria}</td>
                                    <td>{item.tipo}</td>
                                    <td>{item.stock}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onCancel} disabled={importando}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={onConfirm} disabled={importando}>
                        {importando ? "Importando..." : `Confirmar ${importPreview.length} items`}
                    </button>
                </div>
            </div>
        </div>
    );
};

ImportPreviewModal.propTypes = {
    importPreview: PropTypes.array,
    importando: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
};

const CommentModal = ({ modalExt, modalComentario, guardandoComentario, setModalComentario, onCancel, onConfirm }) => {
    if (!modalExt) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4 font-mono">{modalExt.codigo}</h3>
                <textarea
                    className="textarea textarea-bordered w-full"
                    placeholder="Observación sobre esta extensión..."
                    value={modalComentario}
                    onChange={(e) => setModalComentario(e.target.value)}
                    rows={3}
                />
                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onCancel} disabled={guardandoComentario}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={onConfirm} disabled={guardandoComentario}>
                        {guardandoComentario ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
};

CommentModal.propTypes = {
    modalExt: PropTypes.shape({
        itemId: PropTypes.string,
        codigo: PropTypes.string,
    }),
    modalComentario: PropTypes.string.isRequired,
    guardandoComentario: PropTypes.bool.isRequired,
    setModalComentario: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
};

/**
 * Handles the action buttons for an inventory row, encapsulating stopPropagation logic.
 * @param {Object} props
 * @param {boolean} props.isCategory - Determines tooltip and action availability.
 * @param {boolean} props.hasStock - Whether the item can be loaned.
 * @param {Function} props.onEdit - Handler for the edit action.
 * @param {Function} props.onLoan - Handler for the loan action.
 */
const RowActions = ({ isCategory, hasStock, onEdit, onLoan }) => {
    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit();
    };

    const handleLoan = (e) => {
        e.stopPropagation();
        onLoan();
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
        >
            <Menu placement="bottom-end">
                <MenuTrigger asChild>
                    <Button variant="ghost" size="icon" layout="square">
                        <MoreVertIcon />
                    </Button>
                </MenuTrigger>

                <MenuContent>
                    <MenuItem leftIcon={<EditSquareIcon />} onClick={handleEdit}>
                        Editar producto
                    </MenuItem>

                    <MenuItem
                        leftIcon={<GiveFileIcon />}
                        onClick={handleLoan}
                        disabled={!hasStock}
                    >
                        {!hasStock ? "Sin stock para prestar" : isCategory ? "Prestar unidad" : "Prestar"}
                    </MenuItem>
                </MenuContent>
            </Menu>
        </div>
    );
};

RowActions.propTypes = {
    /** Flag to check if the current item is a category template */
    isCategory: PropTypes.bool.isRequired,
    /** Control rule specifying if the item possesses available inventory */
    hasStock: PropTypes.bool.isRequired,
    /** Interception routine triggered on edit requests */
    onEdit: PropTypes.func.isRequired,
    /** Interception routine triggered on loan requests */
    onLoan: PropTypes.func.isRequired,
};

/**
 * Renders the nested extensions table for category items.
 * @param {Object} props
 * @param {Array} props.extensions - List of extension items.
 * @param {string} props.itemId - Parent item ID.
 * @param {Function} props.onOpenCommentModal - Triggers the comment modal.
 */
const CategoryExtensionsTable = ({ extensions, itemId, onOpenCommentModal }) => {
    if (!extensions || extensions.length === 0) {
        return <p className="text-sm text-base-content/50 p-4">Sin extensiones registradas.</p>;
    }

    return (
        <Table wrapperClassName="w-full bg-base-300/50 rounded overflow-hidden">
            <TableHeader className="bg-base-300">
                <TableRow>
                    <TableHead className="text-left w-xs">Código</TableHead>
                    <TableHead className="text-left w-12">Estado</TableHead>
                    <TableHead className="text-left">Comentario</TableHead>
                    <TableHead className="w-8"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {extensions.map((ext) => (
                    <TableRow key={ext.codigo} className="*:py-2!">
                        <TableCell className="font-mono text-sm">{ext.codigo}</TableCell>
                        <TableCell className="*:min-w-20 font-semibold">
                            {ext.disponible ? (
                                <span className="badge badge-success badge-sm shadow-sm/50">Disponible</span>
                            ) : (
                                <span className="badge badge-error badge-sm shadow-sm/50">Prestado</span>
                            )}
                        </TableCell>
                        <TableCell className="italic">
                            {ext.comentario ? (
                                <Tooltip content={ext.comentario}>
                                    <span className="truncate w-fit line-clamp-1 max-w-full">&ldquo;{ext.comentario}&rdquo;</span>
                                </Tooltip>
                            ) : (
                                <EmptyRow />
                            )}
                        </TableCell>
                        <TableCell>
                            <Button
                                color="neutral"
                                className="whitespace-nowrap"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenCommentModal(itemId, ext.codigo, ext.comentario);
                                }}
                            >
                                {ext.comentario ? "Editar comentario" : "Agregar comentario"}
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const InventoryRow = ({ item, expandido, onToggleExpand, onOpenCommentModal, onOpenLoanModal, onOpenEditModal }) => {
    const isCategory = item.tipo === "categoria";
    const extensionsList = item.extensiones || [];
    const totalExtensions = extensionsList.length;

    const availableStock = isCategory
        ? extensionsList.filter((e) => e.disponible).length
        : item.stock;

    const hasStock = availableStock > 0;
    const availabilityPercentage = totalExtensions > 0
        ? (availableStock / totalExtensions) * 100
        : 0;

    const handleRowClick = isCategory ? () => onToggleExpand(item._id) : undefined;

    return (
        <>
            <TableRow
                interactive={isCategory}
                onClick={handleRowClick}
                className={isCategory ? "bg-linear-to-r! from-primary/10 to-50%" : ""}
            >
                {/* Expand Icon */}
                <TableCell className="text-center w-8">
                    {isCategory && (
                        <ChevronDownIcon className={`transition-all size-5 ${expandido ? "" : "-rotate-90"}`} />
                    )}
                </TableCell>

                {/* Name & Category Icon */}
                <TableCell className="font-semibold">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {isCategory && (
                            <Tooltip content="Categoría (grupo)">
                                <span className="shrink-0">
                                    <BoxSeamIcon className="size-5" />
                                </span>
                            </Tooltip>
                        )}
                        <span className="truncate">{item.nombre}</span>
                    </div>
                </TableCell>

                <TableCell className="text-base-content/70">{item.descripcion}</TableCell>
                <TableCell>{item.categoria}</TableCell>

                {/* Stock Indicator */}
                <TableCell className="text-center whitespace-nowrap select-none">
                    <span className={cn(
                        "font-mono justify-center flex min-w-20 bg-base-200 rounded relative overflow-hidden px-3 py-0.5 outline outline-base-content/10",
                        !hasStock && "bg-error text-error-content"
                    )}>
                        {isCategory ? (
                            <Tooltip content={
                                <>
                                    {availabilityPercentage.toFixed(1)}% disponible <br />
                                    {(100 - availabilityPercentage).toFixed(1)}% ocupado
                                </>
                            }>
                                <span className="tracking-widest tabular-nums cursor-help">
                                    {availableStock}/{totalExtensions}
                                </span>
                            </Tooltip>
                        ) : (
                            item.stock
                        )}

                        {/* Progress Bar for Categories */}
                        {hasStock && isCategory && (
                            <div className="absolute h-0.5 w-full bottom-0 left-0 right-0 bg-base-300">
                                <div
                                    className="relative h-full left-0 bg-base-content/50 rounded-r-full"
                                    style={{ width: `${availabilityPercentage}%` }}
                                />
                            </div>
                        )}
                    </span>
                </TableCell>

                {/* Actions Component */}
                <TableCell className="text-center relative">
                    <RowActions
                        isCategory={isCategory}
                        hasStock={hasStock}
                        onEdit={() => onOpenEditModal(item._id)}
                        onLoan={() => onOpenLoanModal(item._id)}
                    />
                </TableCell>
            </TableRow>

            <AnimatePresence initial={false}>
                {isCategory && expandido && (
                    <TableRow>
                        <TableCell colSpan={7} className="p-0! border-b-0">
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <CategoryExtensionsTable
                                    extensions={extensionsList}
                                    itemId={item._id}
                                    onOpenCommentModal={onOpenCommentModal}
                                />
                            </motion.div>
                        </TableCell>
                    </TableRow>
                )}
            </AnimatePresence>
        </>
    );
};

InventoryRow.propTypes = {
    item: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        nombre: PropTypes.string.isRequired,
        descripcion: PropTypes.string,
        categoria: PropTypes.string,
        tipo: PropTypes.string.isRequired,
        stock: PropTypes.number,
        extensiones: PropTypes.array,
    }).isRequired,
    expandido: PropTypes.bool.isRequired,
    onToggleExpand: PropTypes.func.isRequired,
    onOpenCommentModal: PropTypes.func.isRequired,
    onOpenLoanModal: PropTypes.func.isRequired,
    onOpenEditModal: PropTypes.func.isRequired
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function Inventario() {
    const {
        isLoading,
        inventory, setInventory, expandidos, toggleExpand,
        busqueda, setBusqueda, categoriaFiltro, setCategoriaFiltro,
        filteredInventory, hasActiveFilters
    } = useInventoryData();

    const {
        importPreview, setImportPreview, importError, setImportError, importResult, setImportResult,
        importando, fileInputRef, handleFileChange, confirmarImport
    } = useExcelImport(setInventory);

    const {
        modalExt, setModalExt, modalComentario, setModalComentario,
        guardandoComentario, handleGuardarComentario
    } = useExtensionComments(setInventory);

    const [showAddModal, setShowAddModal] = useState(false);
    const [loanModalProductId, setLoanModalProductId] = useState(null);
    const [editModalProductId, setEditModalProductId] = useState(null);

    return (
        <>
            <DataPageLayout
                title="Inventario"
                topContent={
                    <>
                        <div className="flex gap-2 [&_svg]:size-5 ml-auto">
                            <button className="btn btn-outline" onClick={() => exportarExcel(inventory)} disabled={inventory.length === 0}>
                                <DownloadIcon />
                                <span className="hidden xl:inline">Exportar</span>
                            </button>
                            <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
                                <UploadIcon />
                                <span className="hidden xl:inline">Importar</span>
                            </button>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                <AddIcon />
                                <span className="hidden md:inline">Agregar Item</span>
                            </button>
                        </div>
                        {importError && (
                            <div className="alert alert-error mb-4">
                                <span>{importError}</span>
                                <button className="btn btn-xs btn-ghost ml-auto" onClick={() => setImportError(null)}>✕</button>
                            </div>
                        )}
                        {importResult && (
                            <div className={`alert ${importResult.errores > 0 ? "alert-warning" : "alert-success"} mb-4`}>
                                <div>
                                    <p>Se importaron <strong>{importResult.creados}</strong> de <strong>{importResult.total}</strong> items. {importResult.errores > 0 && <span>{importResult.errores} errores.</span>}</p>
                                    {importResult.detalle_errores?.length > 0 && (
                                        <ul className="text-xs mt-1 list-disc list-inside">
                                            {importResult.detalle_errores.map((e, i) => (
                                                <li key={i}>Fila {e.fila} ({e.nombre}): {e.error}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <button className="btn btn-xs btn-ghost ml-auto" onClick={() => setImportResult(null)}>✕</button>
                            </div>
                        )}
                    </>
                }
                headerActions={
                    <>
                        <SearchBar
                            placeholder="Buscar por nombre..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            wrapperClassName="w-sm"
                        />
                        <SelectCategoria
                            value={categoriaFiltro}
                            onChange={(e) => setCategoriaFiltro(e.target.value)}
                            className="select select-bordered w-3xs"
                        />
                    </>
                }
            >
                <QueryStateManager
                    isLoading={isLoading}
                    isEmpty={filteredInventory.length === 0}
                    hasFilters={hasActiveFilters}
                    loadingSlot={<div className="flex flex-1 mask-b-from-0%">
                        <SkeletonTable rows={18} />
                    </div>}
                >
                    <Table wrapperClassName="flex-1 grow min-h-0" zebra>
                        <TableHeader className="bg-base-200 select-none">
                            <TableRow>
                                <TableHead pin className="w-8"></TableHead>
                                <TableHead pin className="min-w-20">Nombre</TableHead>
                                <TableHead pin className="w-full">Descripción</TableHead>
                                <TableHead pin>Categoría</TableHead>
                                <TableHead pin className="text-center">Disponible</TableHead>
                                <TableHead pin />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInventory.map((item) => (
                                <InventoryRow
                                    key={item._id}
                                    item={item}
                                    expandido={!!expandidos[item._id]}
                                    onToggleExpand={toggleExpand}
                                    onOpenCommentModal={(itemId, codigo, comentarioActual) => {
                                        setModalExt({ itemId, codigo });
                                        setModalComentario(comentarioActual || "");
                                    }}
                                    onOpenLoanModal={setLoanModalProductId}
                                    onOpenEditModal={setEditModalProductId}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </QueryStateManager>
            </DataPageLayout>

            {/* Modals outside the flow constraints */}
            {showAddModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <AgregarItem onClose={() => setShowAddModal(false)} />
                    </div>
                </div>
            )}
            <ImportPreviewModal importPreview={importPreview} importando={importando} onCancel={() => setImportPreview(null)} onConfirm={confirmarImport} />
            <CommentModal modalExt={modalExt} modalComentario={modalComentario} guardandoComentario={guardandoComentario} setModalComentario={setModalComentario} onCancel={() => { setModalExt(null); setModalComentario(""); }} onConfirm={handleGuardarComentario} />

            {loanModalProductId && (
                <div className="modal modal-open">
                    <div className="modal-box overflow-visible">
                        <AgregarPrestamo
                            initialProductId={loanModalProductId}
                            onClose={() => setLoanModalProductId(null)}
                        />
                    </div>
                </div>
            )}

            {editModalProductId && (
                <div className="modal modal-open">
                    <div className="modal-box w-11/12 max-w-4xl">
                        <EditarItem
                            itemId={editModalProductId}
                            onClose={() => setEditModalProductId(null)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}