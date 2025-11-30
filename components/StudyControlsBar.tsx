export default function StudyControlsBar() {
    return (
        <section className="controls-bar">
            {/* left section with current study + search */}
            <div className="controls-column controls-search">
                <p className="controls-section-title">
                    User: User name display here
                </p>
                <p className="controls-section-title">
                    Section: current study name (details) display here
                </p>
                <input
                    className="study-search-input"
                    placeholder="Search topics/studies here"
                />
            </div>

            {/* study time frame */}
            <div className="controls-column">
                <h4>Study Time Frame</h4>
                <div className="controls-vertical-buttons">
                    <button>1 Day</button>
                    <button>1 Week</button>
                    <button>1 Month</button>
                </div>
            </div>

            {/* start and end date */}
            <div className="controls-column">
                <h4>Start and End Date</h4>
                <div className="controls-vertical-buttons">
                    <button>Start Date</button>
                    <button>End Date</button>
                </div>
            </div>

            {/* topics to study + related courses */}
            <div className="controls-column controls-topics">
                <h4>Topics to Study</h4>

                <div className="controls-topics-row">
                    {/* left: buttons stacked */}
                    <div className="controls-vertical-buttons">
                        <button>Single</button>
                        <button>Multiple</button>
                        <button>Enter number</button>
                    </div>

                    {/* right: user inputs for topics and related courses */}
                    <div className="controls-topics-boxes">
                        <label className="controls-input-group">
                            <span className="controls-input-label">

                            </span>
                            <textarea
                                className="controls-text-input"
                                placeholder="Topic To Study: Enter the names based on the numbers provided, separated by commas"
                                rows={2}
                            />
                        </label>

                        <label className="controls-input-group">
                            <span className="controls-input-label">

                            </span>
                            <textarea
                                className="controls-text-input"
                                placeholder="Related Courses: Enter related course names for each topic, in sequence and separated by commas"
                                rows={2}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* priority level */}
            <div className="controls-column">
                <h4>Priority Level</h4>
                <div className="controls-vertical-buttons">
                    <button>Priority 1</button>
                    <button>Priority 2</button>
                    <button>Priority 3</button>
                </div>
            </div>

            {/* save / reset buttons on the far right */}
            <div className="controls-column controls-save-reset">
                <button className="save-btn">Save</button>
                <button className="reset-btn">Reset</button>
            </div>
        </section>
    );
}
